import asyncio
import json
import os
import re
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

# Deterministic UPSC CSE Mains Syllabus Keyword & Paper Classification Matrix
UPSC_SYLLABUS_MATRIX = {
    "GS-1 (Society, History & Geography)": [
        "urbanization", "population", "women empowerment", "caste", "secularism", "communalism",
        "regionalism", "monsoon", "cyclone", "el nino", "glacier", "heritage", "colonial", "tribal"
    ],
    "GS-2 (Polity, Governance, Constitution & IR)": [
        "constitution", "supreme court", "governor", "parliament", "federalism", "article ",
        "election commission", "cag", "schedule", "fundamental rights", "directive principles",
        "judiciary", "collegium", "bilateral", "indo-pacific", "unsc", "g20", "brics", "wto",
        "welfare", "panchayat", "municipality", "representation of people", "defection"
    ],
    "GS-3 (Economy, Agriculture, Environment & Security)": [
        "gdp", "inflation", "rbi", "monetary policy", "fiscal deficit", "gst", "msp", "agriculture",
        "food processing", "supply chain", "semiconductor", "infrastructure", "renewable", "cop28",
        "cop29", "climate change", "biodiversity", "eia", "cyber security", "money laundering",
        "naxalism", "terrorism", "border", "isro", "biotechnology", "artificial intelligence"
    ],
    "GS-4 (Ethics, Integrity & Aptitude)": [
        "ethics", "morality", "probity", "corruption", "whistleblower", "conflict of interest",
        "empathy", "compassion", "corporate governance", "emotional intelligence", "civil service"
    ],
}


def deterministic_syllabus_pre_tagger(title: str, body: str) -> List[str]:
    """
    Deterministic keyword scanner that pre-identifies candidate UPSC GS Papers
    before the LLM refines the exact sub-topic.
    """
    combined = f"{title} {body[:4000]}".lower()
    matched_papers: List[str] = []
    for paper, keywords in UPSC_SYLLABUS_MATRIX.items():
        score = sum(1 for kw in keywords if kw in combined)
        if score >= 2:
            matched_papers.append(paper)
    return matched_papers or ["GS-2 (Polity, Governance, Constitution & IR)"]


async def fetch_wikipedia_static_context(queries: List[str]) -> List[Dict[str, str]]:
    """
    Agent 2A: Queries the official Wikipedia REST/Action API concurrently for
    Constitutional Articles, Supreme Court Judgments, and Commissions.
    100% Free, zero API key required, zero hallucination.
    """
    results: List[Dict[str, str]] = []
    headers = {"User-Agent": "AQVONX-EditorialLens/1.0 (https://aqvonx.vercel.app)"}

    async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
        for q in queries[:3]:
            try:
                search_url = "https://en.wikipedia.org/w/api.php"
                params = {
                    "action": "query",
                    "list": "search",
                    "srsearch": f"{q} India constitution OR supreme court OR committee",
                    "utf8": "",
                    "format": "json",
                    "srlimit": 2,
                }
                resp = await client.get(search_url, params=params)
                if resp.status_code == 200:
                    search_items = resp.json().get("query", {}).get("search", [])
                    for item in search_items:
                        clean_snippet = re.sub(r"<[^>]+>", "", item.get("snippet", "")).strip()
                        title = item.get("title", "")
                        if title and clean_snippet:
                            results.append({
                                "source": f"Wikipedia: {title}",
                                "fact": clean_snippet,
                                "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                            })
            except Exception:
                continue
    return results


async def fetch_tavily_enrichment(query: str) -> List[Dict[str, str]]:
    """
    Agent 2B: Optional Tavily Search enrichment if TAVILY_API_KEY is configured in environment.
    Pulls latest PRS Legislative Research / PIB / Supreme Court citations.
    """
    tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
    if not tavily_key:
        return []

    results: List[Dict[str, str]] = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": tavily_key,
                    "query": f"{query} UPSC Constitutional Article Supreme Court judgment committee India",
                    "search_depth": "basic",
                    "max_results": 3,
                },
            )
            if resp.status_code == 200:
                for item in resp.json().get("results", []):
                    results.append({
                        "source": item.get("title", "Official Reference"),
                        "fact": item.get("content", "")[:350],
                        "url": item.get("url", ""),
                    })
    except Exception:
        pass
    return results


def _clean_json_response(raw_text: str) -> str:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


async def run_editoriallens_multi_agent_pipeline(
    article_title: str,
    article_text: str,
    source_url: str,
    target_exam: str = "UPSC CSE"
) -> Dict[str, Any]:
    """
    Executes the 3-Stage EditorialLens Pipeline:
    1. Deterministic UPSC Syllabus Pre-Classifier + Entity Keyword Extractor
    2. Concurrent Wikipedia + Tavily Static Knowledge Retriever (Articles, SC Cases, Committees)
    3. Agent 3 (Mains 250-Word Synthesizer & Tough Prelims Statement-MCQ Builder)
    """
    clean_text = article_text.strip()[:25000]
    candidate_papers = deterministic_syllabus_pre_tagger(article_title, clean_text)

    # Extract high-signal query terms from the title for static knowledge lookup
    title_words = [w for w in re.findall(r"[A-Za-z]{4,}", article_title) if w.lower() not in {"with", "from", "that", "this", "what", "when", "india", "indian", "editorial", "hindu", "express"}]
    primary_query = " ".join(title_words[:5]) or article_title[:60]

    # Run Wikipedia & Tavily lookups in parallel
    wiki_task = fetch_wikipedia_static_context([primary_query, f"{primary_query} Supreme Court"])
    tavily_task = fetch_tavily_enrichment(primary_query)
    wiki_facts, tavily_facts = await asyncio.gather(wiki_task, tavily_task)
    verified_static_refs = (tavily_facts + wiki_facts)[:5]

    system_prompt = """You are EditorialLens, an elite UPSC CSE, State PSC, and RBI Grade B multi-agent synthesizer.
Newspaper editorials only discuss yesterday's political or economic news. Your job is to transform the article into high-scoring exam ammunition by injecting exact Constitutional Articles, Supreme Court Judgments, Official Committees, and Verified Data.

Respond ONLY with a valid JSON object matching this exact schema (no markdown code fences):
{
  "gs_paper": "e.g., GS Paper 2 — Polity & Governance",
  "syllabus_subtopic": "e.g., Functions and responsibilities of the Union and the States; Issues and challenges pertaining to the federal structure",
  "core_thesis_one_liner": "Sharp 1-sentence core takeaway of the editorial",
  "static_exam_linkages": {
    "constitutional_articles": [
      {"article": "Article 200", "relevance": "Governor's assent to Bills passed by State Legislature"}
    ],
    "supreme_court_judgments": [
      {"case_name": "State of Punjab vs Principal Secretary to the Governor (2023)", "ruling": "Governor cannot exercise pocket veto to indefinitely withhold assent"}
    ],
    "committees_and_reports": [
      {"name": "Sarkaria Commission (1988) & Punchhi Commission (2010)", "recommendation": "Fixed time limit of 6 months for Governor to decide on bills"}
    ],
    "key_data_and_stats": [
      "Official NFHS / Economic Survey / RBI / NITI Aayog statistic relevant to the topic"
    ]
  },
  "mains_250_word_blueprint": {
    "introduction": "30-40 word crisp introduction defining the issue with a Constitutional Article or official data stat.",
    "arguments_in_favor": [
      "Point 1 with bold keyword header",
      "Point 2 with bold keyword header",
      "Point 3 with bold keyword header"
    ],
    "challenges_and_criticisms": [
      "Challenge 1 with constitutional/economic impact",
      "Challenge 2 with institutional impact",
      "Challenge 3 with grassroots impact"
    ],
    "way_forward": [
      "Actionable reform 1 (citing a Committee recommendation)",
      "Actionable reform 2 (institutional/legal change)",
      "Actionable reform 3 (long-term structural solution)"
    ],
    "conclusion": "25-35 word balanced, forward-looking conclusion linking to Constitutional morality or SDG goals."
  },
  "practice_mains_question": {
    "question": "Realistic 15-mark (250 words) UPSC Mains question based on this editorial.",
    "directive_word": "Critically Examine / Discuss / Analyze",
    "marks": 15
  },
  "prelims_statement_mcqs": [
    {
      "question_stem": "Consider the following statements regarding [Topic]:",
      "statements": [
        "1. Statement one testing a tricky constitutional or factual detail.",
        "2. Statement two testing an institutional mandate or exception.",
        "3. Statement three testing a recent amendment or judgment."
      ],
      "options": [
        "A) Only one statement is correct",
        "B) Only two statements are correct",
        "C) All three statements are correct",
        "D) None of the statements are correct"
      ],
      "correct_option": "B",
      "detailed_explanation": "Statement 1 is correct because... Statement 2 is correct... Statement 3 is incorrect because..."
    },
    {
      "question_stem": "With reference to [Related Static Concept], consider the following statements:",
      "statements": [
        "1. First statement...",
        "2. Second statement..."
      ],
      "options": [
        "A) 1 only",
        "B) 2 only",
        "C) Both 1 and 2",
        "D) Neither 1 nor 2"
      ],
      "correct_option": "C",
      "detailed_explanation": "Clear breakdown of why each statement is right or wrong."
    }
  ]
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
    synthesized: Optional[Dict[str, Any]] = None
    last_error = ""

    user_prompt = (
        f"Target Exam: {target_exam}\n"
        f"Pre-Identified Candidate GS Papers: {', '.join(candidate_papers)}\n"
        f"Source URL: {source_url}\n"
        f"Article Headline: {article_title}\n\n"
        f"VERIFIED STATIC RESEARCH CONTEXT (Wikipedia / Tavily):\n{json.dumps(verified_static_refs, indent=2)}\n\n"
        f"NEWSPAPER EDITORIAL BODY:\n{clean_text}"
    )

    async with httpx.AsyncClient(timeout=65.0) as client:
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "temperature": 0.15,
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
    synthesized["article_title"] = article_title
    synthesized["source_url"] = source_url
    synthesized["verified_external_references"] = verified_static_refs
    return synthesized


async def evaluate_mains_answer(
    question: str,
    student_answer: str,
    editorial_context: str = ""
) -> Dict[str, Any]:
    """
    Pro Feature: Grades a student's typed Mains answer out of 10 marks against
    UPSC evaluation parameters (Introduction, Constitutional/Static Citations,
    Multi-dimensional Coverage, Way Forward, Word Limit).
    """
    system_prompt = """You are a senior UPSC CSE Mains Examiner. Evaluate the candidate's answer strictly and constructively out of 10 marks.
Respond ONLY with valid JSON matching this schema:
{
  "score_out_of_10": 6.5,
  "verdict_summary": "Good structural flow, but lacks specific Supreme Court case citations and data in the introduction.",
  "strengths": ["Clear subheadings", "Balanced way forward"],
  "missing_ammunition": [
    "Should have cited Article 200 and Sarkaria Commission",
    "Include NFHS-5 or Economic Survey data point in intro"
  ],
  "model_improved_paragraph": "A rewritten 80-word high-scoring core body paragraph demonstrating how a Rank-1 topper would write it."
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
                                "text": f"Mains Question: {question}\nContext: {editorial_context[:3000]}\n\nCandidate's Answer:\n{student_answer[:5000]}"
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
