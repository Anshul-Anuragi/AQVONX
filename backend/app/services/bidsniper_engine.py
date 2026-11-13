import hashlib
import json
import re
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

# Common false-positive words that appear capitalized after "Thanks" or "Working with"
NAME_STOPWORDS = {
    "you", "team", "client", "sir", "madam", "guys", "everyone", "all", "again",
    "so", "very", "much", "for", "the", "great", "good", "awesome", "amazing",
    "working", "him", "her", "them", "upwork", "fiverr", "company", "agency", "lot"
}

# Toxic Client Red-Flag Patterns in Past Freelancer Reviews
RED_FLAG_PATTERNS = [
    (r"(scope\s*creep|changed\s*requirements|extra\s*work|unpaid)", "Scope Creep Warning: Past freelancers reported changing requirements or unpaid extra tasks."),
    (r"(slow\s*response|ghosted|unresponsive|poor\s*communication|delayed)", "Communication Delay: Past reviews mention slow feedback or unresponsive milestones."),
    (r"(micromanag|rude|unreasonable|dispute|cancelled)", "Management Friction: Past reviews indicate micromanagement or contract disputes."),
    (r"(low\s*budget|underpaid|cheap)", "Budget Compression: Client historically negotiates aggressively on hourly/fixed rates."),
]


def deterministic_client_intel_extractor(
    reviews_text: List[str],
    client_stats: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Agent 1 (Deterministic Python Client Detective):
    1. Scans past freelancer feedback using regex patterns ('working with [Name]',
       'thanks [Name]', '[Name] is a great') to uncover the client's hidden first name.
    2. Computes a 0-100 Deal Health Score from Hire Rate, Avg Hourly Paid, and Payment Verification.
    3. Flags behavioral red flags from past freelancer reviews.
    """
    combined_reviews = "\n".join(reviews_text)
    name_counts: Dict[str, int] = {}

    patterns = [
        r"(?:working\s+with|work\s+with|for\s+working\s+with)\s+([A-Z][a-z]{2,14})\b",
        r"(?:thanks|thank\s+you)\s*,?\s+([A-Z][a-z]{2,14})\b",
        r"\b([A-Z][a-z]{2,14})\s+(?:is\s+a\s+great|is\s+an\s+awesome|is\s+a\s+wonderful|was\s+a\s+pleasure|was\s+great|is\s+very\s+clear|provided\s+clear)",
        r"(?:pleasure\s+working\s+with)\s+([A-Z][a-z]{2,14})\b",
    ]

    for pat in patterns:
        for match in re.finditer(pat, combined_reviews, re.IGNORECASE):
            candidate = match.group(1).strip().capitalize()
            if candidate.lower() not in NAME_STOPWORDS:
                name_counts[candidate] = name_counts.get(candidate, 0) + 1

    detected_name = "Not Found in Reviews"
    name_confidence = "LOW"
    name_mentions = 0

    if name_counts:
        best_name, count = sorted(name_counts.items(), key=lambda x: x[1], reverse=True)[0]
        detected_name = best_name
        name_mentions = count
        name_confidence = "HIGH (Verified across multiple reviews)" if count >= 2 else "MEDIUM (Found in 1 review)"

    # Scan for Red Flags
    red_flags: List[str] = []
    lower_reviews = combined_reviews.lower()
    for regex_pat, warning_msg in RED_FLAG_PATTERNS:
        if re.search(regex_pat, lower_reviews):
            red_flags.append(warning_msg)

    # Parse numeric client metrics
    hire_rate_str = str(client_stats.get("hire_rate", "65%"))
    hire_rate_match = re.search(r"(\d+)", hire_rate_str)
    hire_rate = int(hire_rate_match.group(1)) if hire_rate_match else 65

    avg_hourly_str = str(client_stats.get("avg_hourly_rate", "$25/hr"))
    hourly_match = re.search(r"(\d+(?:\.\d+)?)", avg_hourly_str)
    avg_hourly = float(hourly_match.group(1)) if hourly_match else 25.0

    payment_verified = bool(client_stats.get("payment_verified", True))

    if hire_rate < 40:
        red_flags.append(f"Low Hire Rate ({hire_rate}%): Client posts many jobs without hiring. Spend Connects cautiously.")
    if 0 < avg_hourly < 12:
        red_flags.append(f"Low Historical Hourly Rate (${avg_hourly}/hr): Client typically hires budget contractors.")

    # Compute deterministic 0-100 Deal Health Score
    score = 50
    score += min(25, max(-15, (hire_rate - 45) // 2))
    score += 15 if payment_verified else -20
    score += 10 if avg_hourly >= 25 else (5 if avg_hourly >= 15 else -5)
    score -= len(red_flags) * 12
    deal_score = max(10, min(99, score))

    verdict_label = "PRIME CLIENT — BID IMMEDIATELY" if deal_score >= 75 else (
        "MODERATE — WORTH BIDDING" if deal_score >= 50 else "HIGH RISK — SAVE YOUR CONNECTS"
    )

    return {
        "detected_client_name": detected_name,
        "name_confidence": name_confidence,
        "name_mentions_count": name_mentions,
        "deal_health_score": deal_score,
        "deal_verdict": verdict_label,
        "hire_rate_parsed": f"{hire_rate}%",
        "avg_hourly_parsed": f"${avg_hourly:.2f}/hr",
        "payment_verified": payment_verified,
        "red_flags": red_flags or ["No behavioral red flags detected in past freelancer feedback."],
    }


def match_freelancer_portfolio(
    job_title: str,
    job_description: str,
    portfolio_items: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Agent 2 (Portfolio RAG Skill Matcher):
    Scores the freelancer's saved portfolio projects against the job's tech stack
    and domain keywords, returning the top 2 highest-converting proof projects.
    """
    if not portfolio_items:
        return []

    job_corpus = f"{job_title} {job_description}".lower()
    scored_items = []

    for item in portfolio_items:
        title = str(item.get("title", "")).strip()
        stack = str(item.get("tech_stack", "")).strip()
        outcome = str(item.get("outcome", "")).strip()
        url = str(item.get("url", "")).strip()
        if not title:
            continue

        tokens = [
            t.strip().lower()
            for t in re.split(r"[,/|;\s]+", f"{stack} {title}")
            if len(t.strip()) >= 2
        ]
        matched_skills = [tok for tok in set(tokens) if tok in job_corpus]
        score = len(matched_skills) * 15 + (5 if url else 0)
        scored_items.append({
            "title": title,
            "tech_stack": stack,
            "outcome": outcome,
            "url": url,
            "matched_skills": matched_skills[:6],
            "relevance_score": min(99, max(40, 55 + score)),
        })

    scored_items.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored_items[:2]


def _clean_json_response(raw_text: str) -> str:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


async def run_bidsniper_multi_agent_pipeline(
    job_title: str,
    job_description: str,
    reviews_list: List[str],
    client_stats: Dict[str, Any],
    screening_questions: List[str],
    portfolio_items: List[Dict[str, Any]],
    proposal_tone: str = "Technical Architect",
    source_url: str = ""
) -> Dict[str, Any]:
    """
    Executes the 3-Agent BidSniper Pipeline:
    1. Deterministic Client Name, Red-Flag & Deal Health Evaluator
    2. Portfolio RAG Project Matcher
    3. Anti-AI Proposal Writer + Screening Answer Generator + Architecture Blueprint Builder
    """
    client_intel = deterministic_client_intel_extractor(reviews_list, client_stats)
    matched_projects = match_freelancer_portfolio(job_title, job_description, portfolio_items)
    job_fingerprint = hashlib.sha256(f"{source_url}::{job_title}::{job_description[:400]}".encode("utf-8")).hexdigest()[:12]

    greeting_instruction = (
        f"Address the client naturally by their discovered first name: 'Hi {client_intel['detected_client_name']},'"
        if client_intel["detected_client_name"] != "Not Found in Reviews"
        else "Start directly with 'Hi there,' (do NOT use 'Dear Hiring Manager' or 'Greetings')"
    )

    system_prompt = f"""You are BidSniper AI, an elite Upwork & Fiverr Top-Rated Plus Proposal Architect.
Clients reject 95% of proposals because they sound like generic ChatGPT fluff ('I hope this message finds you well', 'I am a seasoned developer', 'delve', 'testament').

STRICT ANTI-AI PROPOSAL RULES:
1. {greeting_instruction}
2. Sentence 1 (The Pattern-Interrupt Hook): Reference a SPECIFIC technical detail, bottleneck, or goal from their job post and state the exact architectural fix or ask 1 razor-sharp engineering question.
3. Body (The 3-Step Execution Plan): 3 ultra-concise bullet points explaining HOW you will build/solve it (mentioning exact libraries, APIs, or workflows).
4. Proof (Portfolio Match): Naturally weave in the freelancer's matched portfolio projects provided in the prompt (if any).
5. Call to Action: Low-friction closing offering to walk through the attached System Architecture Blueprint on a quick 10-minute call.
6. Keep total proposal length between 130 and 175 words. Zero buzzwords, zero em-dashes.

Respond ONLY with a valid JSON object matching this exact schema:
{{
  "ai_refined_client_name": "Confirmed client first name from reviews (or 'Not Found')",
  "client_hidden_pain_points": [
    "Specific unspoken technical or business pain point implied by the job post",
    "Second critical priority the client cares about most"
  ],
  "technical_edge_cases_to_mention": [
    {{
      "edge_case": "e.g., Webhook Idempotency & Retry Race Conditions",
      "why_it_impresses_client": "Shows you have built production systems and anticipated failure modes they didn't even think of"
    }},
    {{
      "edge_case": "Second technical gotcha specific to this job",
      "why_it_impresses_client": "Why mentioning this wins the interview"
    }}
  ],
  "winning_proposal": {{
    "hook_opening_line": "The exact first 2 lines (first 160 characters visible in Upwork's preview list before the client even clicks!)",
    "full_proposal_text": "The complete, ready-to-paste 150-word human proposal with line breaks",
    "ps_authority_line": "P.S. I mapped out a quick 4-stage architecture diagram for your [project type]—attached to this proposal so you can see how the data flow works."
  }},
  "screening_question_answers": [
    {{
      "question": "Screening question from job post (or common technical question if none provided)",
      "winning_answer": "Direct, proof-backed 2-3 sentence answer"
    }}
  ],
  "architecture_blueprint": {{
    "diagram_title": "Proposed Production Architecture for Client",
    "nodes": [
      {{"step": "01", "layer": "Client / Ingestion Layer", "tech": "Exact stack (e.g., Next.js 15 / Webhook Listener)", "detail": "Handles auth & payload validation"}},
      {{"step": "02", "layer": "Core Processing / Agent Layer", "tech": "Exact stack (e.g., FastAPI Async Worker)", "detail": "Executes business logic & rate control"}},
      {{"step": "03", "layer": "Data & State Layer", "tech": "Exact stack (e.g., PostgreSQL + Redis Cache)", "detail": "ACID persistence & sub-10ms lookups"}},
      {{"step": "04", "layer": "Delivery & Observability", "tech": "Exact stack (e.g., Stripe Webhooks + Sentry)", "detail": "Real-time sync & automated error alerts"}}
    ]
  }},
  "milestone_and_bid_estimator": {{
    "recommended_bid_strategy": "e.g., Suggest $850 across 3 milestones (or $35/hr)",
    "estimated_delivery_time": "e.g., 10-14 Days",
    "milestones": [
      {{"milestone_name": "Milestone 1: Core Architecture & API Setup", "percentage": "30%", "deliverable": "Working backend & repo setup"}},
      {{"milestone_name": "Milestone 2: Feature Integration & UI", "percentage": "45%", "deliverable": "Staging deployment for client review"}},
      {{"milestone_name": "Milestone 3: QA, Edge-Case Testing & Handoff", "percentage": "25%", "deliverable": "Production launch + documentation"}}
    ]
  }}
}}"""

    user_prompt = (
        f"JOB FINGERPRINT: {job_fingerprint}\n"
        f"REQUESTED PROPOSAL TONE: {proposal_tone}\n"
        f"SOURCE URL: {source_url}\n"
        f"JOB TITLE: {job_title}\n\n"
        f"DETERMINISTIC CLIENT INTEL:\n{json.dumps(client_intel, indent=2)}\n\n"
        f"PAST FREELANCER REVIEWS ON CLIENT PROFILE:\n{json.dumps(reviews_list[:15], indent=2)}\n\n"
        f"MATCHED FREELANCER PORTFOLIO PROJECTS:\n{json.dumps(matched_projects, indent=2)}\n\n"
        f"CLIENT SCREENING QUESTIONS:\n{json.dumps(screening_questions, indent=2)}\n\n"
        f"FULL JOB DESCRIPTION:\n{job_description[:18000]}"
    )

    api_key = settings.GEMINI_API_KEY
    models_to_try = [
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ]
    synthesized: Optional[Dict[str, Any]] = None
    last_error = ""

    async with httpx.AsyncClient(timeout=65.0) as client:
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "temperature": 0.25,
                    "responseMimeType": "application/json",
                },
            }
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
                    synthesized = json.loads(_clean_json_response(raw_json))
                    break
                else:
                    last_error = f"{model_name} HTTP {resp.status_code}: {resp.text[:200]}"
            except Exception as exc:
                last_error = str(exc)

    if not synthesized:
        raise RuntimeError(f"BidSniper synthesis failed: {last_error}")

    # Merge deterministic client intel with AI refinement
    ai_name = synthesized.get("ai_refined_client_name", "Not Found")
    if client_intel["detected_client_name"] == "Not Found in Reviews" and ai_name and ai_name != "Not Found":
        client_intel["detected_client_name"] = ai_name
        client_intel["name_confidence"] = "MEDIUM (Extracted via NLP context)"

    synthesized["status"] = "success"
    synthesized["job_fingerprint"] = job_fingerprint
    synthesized["job_title"] = job_title
    synthesized["client_intel"] = client_intel
    synthesized["matched_portfolio"] = matched_projects
    return synthesized
