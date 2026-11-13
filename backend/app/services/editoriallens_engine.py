import asyncio
import hashlib
import json
import os
import re
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

# High-Precision UPSC CSE Mains Syllabus & Micro-Topic Anchor Matrix
UPSC_MICRO_SYLLABUS = {
    "GS-1": {
        "paper": "GS Paper I — Heritage, History, Society & Geography",
        "anchors": [
            "Salient features of Indian Society, Diversity of India",
            "Role of women and women's organization, population and associated issues, urbanization",
            "Effects of globalization on Indian society",
            "Social empowerment, communalism, regionalism & secularism",
            "Salient features of world's physical geography & Geophysical phenomena (earthquakes, cyclones, monsoon)",
        ],
    },
    "GS-2": {
        "paper": "GS Paper II — Polity, Constitution, Governance, Social Justice & IR",
        "anchors": [
            "Indian Constitution: historical underpinnings, evolution, features, amendments, basic structure",
            "Functions and responsibilities of the Union and the States, federal structure, devolution of powers",
            "Separation of powers between various organs, dispute redressal mechanisms",
            "Parliament and State legislatures: structure, functioning, conduct of business, powers & privileges",
            "Appointment to various Constitutional posts, powers, functions (Governor, EC, CAG, UPSC)",
            "Government policies and interventions for development, Welfare schemes for vulnerable sections",
            "Role of Civil Services in a democracy, e-Governance, transparency & accountability (RTI, Citizen Charters)",
            "India and its neighborhood relations; Bilateral, regional and global groupings (Quad, BRICS, G20, UN)",
        ],
    },
    "GS-3": {
        "paper": "GS Paper III — Economy, Agriculture, Science & Tech, Environment & Internal Security",
        "anchors": [
            "Indian Economy and issues relating to planning, mobilization of resources, growth, development and employment",
            "Inclusive growth and issues arising from it; Government Budgeting & Fiscal Policy",
            "Major crops, cropping patterns, e-technology in the aid of farmers, MSP, Public Distribution System (PDS)",
            "Infrastructure: Energy, Ports, Roads, Airports, Railways; Investment models (PPP)",
            "Achievements of Indians in science & technology; Indigenization of technology (ISRO, DRDO, AI, Biotech)",
            "Conservation, environmental pollution and degradation, environmental impact assessment (EIA), Climate Change",
            "Linkages between development and spread of extremism; Cyber security, Money-laundering & Border management",
        ],
    },
    "GS-4": {
        "paper": "GS Paper IV — Ethics, Integrity & Aptitude",
        "anchors": [
            "Ethics and Human Interface: Essence, determinants and consequences of Ethics in human actions",
            "Attitude, Emotional Intelligence, and Foundational values for Civil Service (integrity, impartiality, empathy)",
            "Public/Civil service values and Ethics in Public administration: ethical dilemmas, conflict of interest",
            "Probity in Governance: Philosophical basis of governance, Information sharing, Codes of Conduct, Citizen's Charters",
        ],
    },
}


def _clean_json_response(raw_text: str) -> str:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


async def fetch_wikipedia_static_context(queries: List[str]) -> List[Dict[str, str]]:
    """
    Concurrently queries Wikipedia Action API for exact Constitutional Articles,
    Acts, Supreme Court Judgments, and Commissions mentioned or implied by the editorial.
    """
    results: List[Dict[str, str]] = []
    seen_titles = set()
    headers = {"User-Agent": "AQVONX-EditorialLens/2.0 (https://aqvonx.vercel.app)"}

    async with httpx.AsyncClient(timeout=7.5, headers=headers) as client:
        for q in queries[:3]:
            try:
                resp = await client.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "list": "search",
                        "srsearch": q,
                        "utf8": "",
                        "format": "json",
                        "srlimit": 2,
                    },
                )
                if resp.status_code == 200:
                    for item in resp.json().get("query", {}).get("search", []):
                        title = item.get("title", "")
                        if title and title not in seen_titles:
                            seen_titles.add(title)
                            snippet = re.sub(r"<[^>]+>", "", item.get("snippet", "")).strip()
                            results.append({
                                "source": f"Wikipedia: {title}",
                                "fact": snippet,
                                "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                            })
            except Exception:
                continue
    return results


async def fetch_tavily_enrichment(query: str) -> List[Dict[str, str]]:
    tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
    if not tavily_key:
        return []
    results: List[Dict[str, str]] = []
    try:
        async with httpx.AsyncClient(timeout=8.5) as client:
            resp = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": tavily_key,
                    "query": f"{query} India UPSC Constitutional Article Supreme Court judgment committee PRS",
                    "search_depth": "basic",
                    "max_results": 3,
                },
            )
            if resp.status_code == 200:
                for item in resp.json().get("results", []):
                    results.append({
                        "source": item.get("title", "PRS / Official Source"),
                        "fact": item.get("content", "")[:380],
                        "url": item.get("url", ""),
                    })
    except Exception:
        pass
    return results


async def run_editoriallens_multi_agent_pipeline(
    article_title: str,
    article_text: str,
    source_url: str,
    target_exam: str = "UPSC CSE"
) -> Dict[str, Any]:
    clean_text = article_text.strip()[:28000]
    article_fingerprint = hashlib.sha256(f"{source_url}::{article_title}::{clean_text[:500]}".encode("utf-8")).hexdigest()[:12]

    # Build targeted research queries from headline + opening paragraph
    headline_terms = [
        w for w in re.findall(r"[A-Za-z]{4,}", f"{article_title} {clean_text[:300]}")
        if w.lower() not in {"with", "from", "that", "this", "what", "when", "have", "been", "will", "more", "than", "into", "over", "after", "before", "hindu", "express", "editorial", "opinion"}
    ]
    q_base = " ".join(headline_terms[:6]) or article_title[:70]

    wiki_task = fetch_wikipedia_static_context([
        f"{q_base} India Constitution Supreme Court",
        f"{q_base} Committee Commission Act India"
    ])
    tavily_task = fetch_tavily_enrichment(q_base)
    wiki_facts, tavily_facts = await asyncio.gather(wiki_task, tavily_task)
    verified_static_refs = (tavily_facts + wiki_facts)[:6]

    system_prompt = """You are EditorialLens Pro, India's #1 UPSC CSE, State PSC, and RBI Grade B Topper Workbench.
Your mission is to analyze the EXACT provided newspaper article and convert it into high-scoring, zero-fluff exam notes that make a serious UPSC aspirant feel grateful.

CRITICAL ACCURACY RULES:
1. Analyze ONLY the specific article provided in the prompt. Every single point must be grounded in the article's actual subject matter plus verified Indian constitutional/statutory/economic facts.
2. NEVER hallucinate fake article numbers or fake case names. Use exact Constitutional Articles, real Supreme Court judgments (with years), real 2nd ARC / Law Commission / Parliamentary Standing Committee reports, and real official data (Economic Survey, RBI, NFHS-5, NITI Aayog, NCRB, IPCC).
3. Include a 'prelims_rapid_facts' array highlighting sneaky Prelims traps (e.g., 'Which ministry/body?', 'Constitutional vs Statutory body?', 'Binding vs Not binding?').
4. Include a 'pyq_linkage' object showing how UPSC has asked about this theme in Past Year Prelims/Mains Questions.
5. Include a 'mains_flowchart' object (center hub + 4 spoke nodes) so the student can draw a quick box diagram in their real paper to get +1.5 extra marks.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "gs_paper": "GS Paper II — Polity & Governance (or GS-I / GS-III / GS-IV)",
  "syllabus_subtopic": "Exact UPSC Mains syllabus line item",
  "exam_relevance_rating": "HIGH YIELD (Mains + Prelims)",
  "reading_time_saved": "Saves ~35 mins of manual note-making",
  "core_thesis_one_liner": "Crystal-clear 1-sentence crux of the author's argument",
  "context_why_in_news": "2 crisp sentences explaining the immediate trigger event in the article",
  "pyq_linkage": {
    "past_question": "Actual or closely mirrored UPSC Mains/Prelims PYQ on this theme with year (e.g., UPSC Mains 2022 GS-2)",
    "examiner_angle": "Why UPSC repeatedly targets this theme and what angle to focus on"
  },
  "prelims_rapid_facts": [
    {
      "fact_label": "e.g., Constitutional Status / Nodal Ministry / Legal Provision",
      "exact_detail": "Exact factual rule for Prelims revision",
      "prelims_trap_warning": "Common trap UPSC sets in statement questions (e.g., 'Not defined in the Constitution', 'Only Parliament, not State Legislature')"
    }
  ],
  "static_exam_linkages": {
    "constitutional_articles": [
      {"article": "Exact Article / Schedule / Act", "relevance": "How it directly governs this issue"}
    ],
    "supreme_court_judgments": [
      {"case_name": "Case Name (Year)", "ruling": "Core doctrine or ratio decidendi laid down by SC"}
    ],
    "committees_and_reports": [
      {"name": "Commission / Committee / 2nd ARC Report", "recommendation": "Specific actionable recommendation to quote in Way Forward"}
    ],
    "key_data_and_stats": [
      "Exact verified statistic with source (e.g., RBI / Economic Survey / NITI Aayog / UN Report) to quote in Mains Intro"
    ]
  },
  "mains_flowchart": {
    "diagram_title": "Title for a 30-second Mains Exam Box Flowchart",
    "center_hub": "Core Theme (3-5 words)",
    "spokes": [
      {"dimension": "Constitutional / Legal", "detail": "Short 5-word point"},
      {"dimension": "Economic / Institutional", "detail": "Short 5-word point"},
      {"dimension": "Social / Federal Impact", "detail": "Short 5-word point"},
      {"dimension": "Reform / Way Forward", "detail": "Short 5-word point"}
    ]
  },
  "mains_250_word_blueprint": {
    "introduction": "35-40 word topper-style introduction starting with a Constitutional Article, definition, or official data point.",
    "arguments_in_favor": [
      "Keyword Header: Explanation with concrete example from the article",
      "Keyword Header: Explanation with institutional/policy impact",
      "Keyword Header: Explanation with long-term strategic benefit"
    ],
    "challenges_and_criticisms": [
      "Keyword Header: Structural/legal bottleneck explained clearly",
      "Keyword Header: Implementation or fiscal challenge",
      "Keyword Header: Federal/ethical/social concern"
    ],
    "way_forward": [
      "Short-Term Reform: Specific institutional or statutory fix (citing a Committee)",
      "Medium-Term Reform: Capacity building or procedural reform",
      "Long-Term Vision: Structural alignment with Constitutional morality / SDGs"
    ],
    "conclusion": "30-word balanced, optimistic topper conclusion."
  },
  "key_vocabulary_and_keywords": [
    "3 to 5 high-scoring Mains keywords from this topic (e.g., 'Cooperative Federalism', 'Constitutional Morality', 'Fiscal Consolidation')"
  ],
  "practice_mains_question": {
    "question": "Realistic 15-mark (250 words) UPSC Mains question tailored to this exact editorial.",
    "directive_word": "Critically Analyze / Discuss / Examine",
    "directive_meaning": "1-line tip on how to address this specific directive word",
    "marks": 15
  },
  "prelims_statement_mcqs": [
    {
      "question_stem": "Consider the following statements regarding [Specific Topic from Article]:",
      "statements": [
        "1. First statement testing an exact constitutional, statutory, or institutional rule.",
        "2. Second statement testing a nuanced exception or trap.",
        "3. Third statement testing a related factual provision."
      ],
      "options": [
        "A) Only one statement is correct",
        "B) Only two statements are correct",
        "C) All three statements are correct",
        "D) None of the statements are correct"
      ],
      "correct_option": "B",
      "detailed_explanation": "Statement 1 is correct because... Statement 2 is correct because... Statement 3 is incorrect because..."
    },
    {
      "question_stem": "With reference to [Key Concept/Body in the Editorial], consider the following statements:",
      "statements": [
        "1. Statement one...",
        "2. Statement two..."
      ],
      "options": [
        "A) 1 only",
        "B) 2 only",
        "C) Both 1 and 2",
        "D) Neither 1 nor 2"
      ],
      "correct_option": "C",
      "detailed_explanation": "Detailed statement-by-statement verification."
    }
  ]
}"""

    user_prompt = (
        f"ARTICLE FINGERPRINT ID: {article_fingerprint}\n"
        f"TARGET EXAM: {target_exam}\n"
        f"SOURCE URL: {source_url}\n"
        f"ARTICLE HEADLINE: {article_title}\n\n"
        f"UPSC SYLLABUS REFERENCE MATRIX:\n{json.dumps(UPSC_MICRO_SYLLABUS, indent=2)}\n\n"
        f"VERIFIED EXTERNAL RESEARCH CONTEXT (Wikipedia / PRS / Tavily):\n{json.dumps(verified_static_refs, indent=2)}\n\n"
        f"FULL NEWSPAPER EDITORIAL TEXT TO ANALYZE:\n{clean_text}"
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

    async with httpx.AsyncClient(timeout=70.0) as client:
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
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
        raise RuntimeError(f"EditorialLens synthesis failed: {last_error}")

    synthesized["status"] = "success"
    synthesized["article_fingerprint"] = article_fingerprint
    synthesized["article_title"] = article_title
    synthesized["source_url"] = source_url
    synthesized["verified_external_references"] = verified_static_refs
    return synthesized


async def evaluate_mains_answer(
    question: str,
    student_answer: str,
    editorial_context: str = ""
) -> Dict[str, Any]:
    system_prompt = """You are a senior UPSC CSE Mains Examiner. Evaluate the candidate's answer strictly out of 10 marks (or 15 marks scaled to 10) across 4 parameters: Introduction, Body & Multidimensionality, Value-Addition (Articles/SC Cases/Data), and Way Forward.
Respond ONLY with valid JSON matching this schema:
{
  "score_out_of_10": 7.0,
  "parameter_scores": {
    "intro_and_context": "2.0 / 2.5",
    "multidimensional_body": "2.5 / 3.5",
    "citations_and_data": "1.0 / 2.0",
    "way_forward_and_conclusion": "1.5 / 2.0"
  },
  "verdict_summary": "Constructive 2-sentence feedback on the answer's structure and depth.",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "missing_ammunition": [
    "Exact Article, Supreme Court case, Committee, or Data point the student missed"
  ],
  "model_improved_paragraph": "A rewritten 90-word Rank-1 topper body paragraph showing how to weave constitutional articles, data, and committee names effortlessly."
}"""

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

    async with httpx.AsyncClient(timeout=45.0) as client:
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": f"Mains Question: {question}\nEditorial Context: {editorial_context[:3500]}\n\nCandidate's Answer:\n{student_answer[:6000]}"
                            }
                        ],
                    }
                ],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
            }
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    raw_json = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(_clean_json_response(raw_json))
            except Exception:
                continue

    raise RuntimeError("Failed to evaluate Mains answer")
