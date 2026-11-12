import base64
import json
import re
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from typing import Dict, Any, List, Optional
import pymupdf as fitz  # PyMuPDF
import httpx
from app.core.config import settings

# Canonical Indian Engineering Branch Equivalency & Exclusion Matrix
BRANCH_ALIASES = {
    "CS": ["computer science", "cse", "cs", "computer eng", "b.tech (cs)", "b.e (cs)"],
    "IT": ["information technology", "it", "info tech", "b.tech (it)", "b.e (it)"],
    "ECE": ["electronics and communication", "ece", "electronics & comm", "e&tc", "entc"],
    "EE": ["electrical engineering", "ee", "electrical", "eee", "electrical & electronics"],
    "ME": ["mechanical engineering", "me", "mechanical", "prod"],
    "CE": ["civil engineering", "ce", "civil"],
    "IN": ["instrumentation", "ice", "ein"],
}

# Standard Central Govt / PSU Upper Age Relaxation Rules (in years)
CATEGORY_RELAXATION_YEARS = {
    "UR": 0,
    "GEN": 0,
    "EWS": 0,
    "OBC": 3,      # OBC-NCL
    "OBC-NCL": 3,
    "SC": 5,
    "ST": 5,
    "PWD_GEN": 10,
    "PWD_OBC": 13,
    "PWD_SC_ST": 15,
}


def extract_page_tagged_markdown(pdf_bytes: bytes, max_pages: int = 85) -> str:
    """
    Extracts structured text and multi-column tables from raw PDF bytes,
    injecting explicit [PAGE X] markers so the LLM cannot suffer from
    'Lost in the Middle' or hallucinate page citations.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    relevant_Keywords = re.compile(
        r"(eligib|age\s*limit|relaxation|qualific|branch|discipline|cutoff|crucial\s*date|"
        r"as\s*on|vacanc|gate|b\.?tech|b\.?e\.?|not\s*eligible|final\s*year|cgpa|percentage|"
        r"application\s*fee|important\s*date|annexure|caste|obc|ews)",
        re.IGNORECASE,
    )

    extracted_pages: List[str] = []
    total_pages = min(len(doc), max_pages)

    for idx in range(total_pages):
        page = doc[idx]
        page_num = idx + 1
        text = page.get_text("text")

        # Always keep first 5 pages, last 3 pages, or any page matching recruitment rules
        if page_num <= 5 or page_num >= (total_pages - 2) or relevant_Keywords.search(text):
            # Extract tables cleanly if present on page
            table_md = ""
            try:
                tabs = page.find_tables()
                for t_idx, tab in enumerate(tabs):
                    df = tab.extract()
                    if df:
                        rows = [" | ".join([str(cell or "").strip().replace("\n", " ") for cell in row]) for row in df]
                        table_md += f"\n[TABLE {t_idx + 1} ON PAGE {page_num}]\n" + "\n".join(rows) + "\n"
            except Exception:
                pass

            extracted_pages.append(
                f"\n==================== [PAGE {page_num}] ====================\n{text.strip()}\n{table_md}"
            )

    doc.close()
    full_text = "\n".join(extracted_pages)
    # Cap at 160,000 chars to prevent context overflow while retaining all rule tables
    return full_text[:160000]


def calculate_exact_age(dob_str: str, cutoff_str: str) -> Dict[str, Any]:
    """
    Deterministic Python calendar math (NEVER let an LLM compute dates).
    Returns exact years, months, days, and total days difference.
    """
    try:
        dob = datetime.strptime(dob_str.strip(), "%Y-%m-%d").date()
        cutoff = datetime.strptime(cutoff_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        return {"valid": False, "error": f"Invalid date format: DOB={dob_str}, Cutoff={cutoff_str}"}

    diff = relativedelta(cutoff, dob)
    return {
        "valid": True,
        "years": diff.years,
        "months": diff.months,
        "days": diff.days,
        "formatted": f"{diff.years}y {diff.months}m {diff.days}d",
        "dob": dob.isoformat(),
        "cutoff": cutoff.isoformat(),
    }


def evaluate_deterministic_eligibility(
    candidate_profile: Dict[str, Any],
    extracted_rules: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Agent 2: Deterministic Python Rule Evaluator.
    Compares candidate's DOB, Category, Branch, and CGPA/Percentage against
    the structured rules extracted by Agent 1.
    """
    dob_str = candidate_profile.get("dob", "2001-01-01")
    category = candidate_profile.get("category", "UR").upper()
    user_branch = candidate_profile.get("branch", "CS").upper()
    user_percentage = float(candidate_profile.get("percentage", 75.0))
    is_final_year = bool(candidate_profile.get("is_final_year", False))

    # 1. Age Calculation
    cutoff_date = extracted_rules.get("age_cutoff_date") or date.today().isoformat()
    base_max_age = int(extracted_rules.get("unreserved_max_age") or 28)

    # Check if notification specifies custom relaxation or use standard central govt rules
    custom_relax = extracted_rules.get("category_relaxation_years", {})
    relaxation = int(custom_relax.get(category, CATEGORY_RELAXATION_YEARS.get(category, 0)))
    effective_max_age = base_max_age + relaxation

    age_math = calculate_exact_age(dob_str, cutoff_date)
    age_eligible = True
    if age_math.get("valid"):
        # Candidate exceeds limit if years > max, or years == max and (months > 0 or days > 0)
        if (
            age_math["years"] > effective_max_age
            or (age_math["years"] == effective_max_age and (age_math["months"] > 0 or age_math["days"] > 0))
        ):
            age_eligible = False

    # 2. Branch & IT-vs-CS Exclusion Check
    allowed_branches = [b.upper() for b in extracted_rules.get("eligible_branches", [])]
    excluded_branches = [b.upper() for b in extracted_rules.get("explicitly_excluded_branches", [])]

    branch_eligible = True
    branch_warning = None
    if user_branch in excluded_branches:
        branch_eligible = False
        branch_warning = f"Your branch ({user_branch}) is explicitly excluded in footnotes."
    elif allowed_branches and user_branch not in allowed_branches:
        # Check if CS is allowed but IT is not mentioned
        if user_branch == "IT" and "CS" in allowed_branches and "IT" not in allowed_branches:
            branch_eligible = False
            branch_warning = "Notification lists Computer Science (CS) but omits Information Technology (IT). Verify equivalences."
        else:
            branch_eligible = False
            branch_warning = f"Required branches: {', '.join(allowed_branches)}. Your branch: {user_branch}."

    # 3. Minimum Percentage / CGPA Check
    min_pct = float(extracted_rules.get("min_percentage_ur", 60.0))
    if category in ("SC", "ST", "PWD_GEN", "PWD_OBC", "PWD_SC_ST"):
        min_pct = float(extracted_rules.get("min_percentage_reserved", 50.0))

    marks_eligible = user_percentage >= min_pct

    # 4. Final Year Appearing Check
    final_year_allowed = bool(extracted_rules.get("final_year_eligible", True))
    standing_eligible = True if not is_final_year else final_year_allowed

    overall_eligible = age_eligible and branch_eligible and marks_eligible and standing_eligible

    return {
        "overall_eligible": overall_eligible,
        "verdict_badge": "ELIGIBLE" if overall_eligible else "NOT ELIGIBLE",
        "age_check": {
            "eligible": age_eligible,
            "candidate_age_on_cutoff": age_math.get("formatted", "N/A"),
            "cutoff_date": cutoff_date,
            "base_max_age_ur": base_max_age,
            "category_applied": category,
            "relaxation_years": relaxation,
            "effective_max_age": effective_max_age,
            "citation": extracted_rules.get("age_citation", "Page 1"),
        },
        "branch_check": {
            "eligible": branch_eligible,
            "user_branch": user_branch,
            "allowed_branches": allowed_branches,
            "excluded_branches": excluded_branches,
            "warning": branch_warning,
            "citation": extracted_rules.get("branch_citation", "Page 1"),
        },
        "marks_check": {
            "eligible": marks_eligible,
            "user_percentage": user_percentage,
            "required_percentage": min_pct,
            "citation": extracted_rules.get("marks_citation", "Page 1"),
        },
        "final_year_check": {
            "eligible": standing_eligible,
            "is_final_year_student": is_final_year,
            "final_year_allowed_in_pdf": final_year_allowed,
            "citation": extracted_rules.get("final_year_citation", "Page 1"),
        },
    }


async def run_portalsnap_multi_agent_pipeline(
    pdf_bytes: bytes,
    candidate_profile: Dict[str, Any],
    is_pro: bool = False
) -> Dict[str, Any]:
    """
    Executes the 3-Stage PortalSnap Pipeline:
    1. Page-Tagged Table & Text Extraction (PyMuPDF)
    2. Agent 1 (Structural Rule Extractor) + Agent 3 (Footnote Trap Hunter) via Gemini JSON Schema
    3. Agent 2 (Deterministic Python Date & Rule Engine)
    """
    tagged_markdown = extract_page_tagged_markdown(pdf_bytes)

    system_prompt = """You are PortalSnap Agent 1 (Structural Extractor) & Agent 3 (Footnote Trap Hunter) for Indian PSU, GATE, UPSC, SSC, and Banking recruitment notifications.
Read the [PAGE X] tagged document carefully. Extract EXACT facts and ALWAYS cite the exact [Page X, Clause Y] where each rule appears.
Respond ONLY with a valid JSON object matching this exact structure (no markdown fences):
{
  "organization_name": "e.g., ONGC / DRDO / IOCL / SSC",
  "post_title": "e.g., Graduate Trainee (Engineering)",
  "total_vacancies": "e.g., 312 Posts (UR: 140, OBC: 82, SC: 50, ST: 40)",
  "age_cutoff_date": "YYYY-MM-DD (if not found, use current year-08-01)",
  "unreserved_max_age": 28,
  "age_citation": "Page X, Clause Y",
  "eligible_branches": ["CS", "IT", "ECE", "EE", "ME", "CE"],
  "explicitly_excluded_branches": [],
  "branch_citation": "Page X, Table Z",
  "min_percentage_ur": 60.0,
  "min_percentage_reserved": 50.0,
  "marks_citation": "Page X, Clause Y",
  "final_year_eligible": true,
  "final_year_citation": "Page X, Note",
  "application_fee": "e.g., ₹500 for UR/OBC/EWS; Nil for SC/ST/PwD",
  "important_dates": {
    "start_date": "DD MMM YYYY",
    "last_date": "DD MMM YYYY",
    "exam_date": "DD MMM YYYY or TBA"
  },
  "hidden_footnote_traps": [
    {
      "trap_title": "e.g., CGPA Conversion Formula Mandatory",
      "description": "Exact trap rule from footnote",
      "citation": "Page X, Footnote *"
    }
  ],
  "selection_process": "e.g., GATE 2026 Score (85% weightage) + Personal Interview (15%)",
  "document_checklist": [
    "Photo (20-50 KB, white background)",
    "OBC-NCL certificate issued on or after 01 April 2026"
  ],
  "extra_syllabus_topics": ["Project Management", "Material Science"]
}"""

    api_key = settings.GEMINI_API_KEY
    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]
    extracted_rules: Optional[Dict[str, Any]] = None
    last_error = ""

    async with httpx.AsyncClient(timeout=65.0) as client:
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": f"Candidate Profile Context: {json.dumps(candidate_profile)}\n\nRECRUITMENT NOTIFICATION TEXT:\n{tagged_markdown}"
                            }
                        ],
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "responseMimeType": "application/json",
                },
            }
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
                    clean_json = raw_json.strip()
                    if clean_json.startswith("```json"):
                        clean_json = clean_json[7:]
                    if clean_json.startswith("```"):
                        clean_json = clean_json[3:]
                    if clean_json.endswith("```"):
                        clean_json = clean_json[:-3]
                    extracted_rules = json.loads(clean_json.strip())
                    break
                else:
                    last_error = f"{model_name} HTTP {resp.status_code}: {resp.text[:200]}"
            except Exception as exc:
                last_error = str(exc)

    if not extracted_rules:
        raise RuntimeError(f"PortalSnap Gemini extraction failed: {last_error}")

    # Run Agent 2: Deterministic Python Math & Rule Evaluator
    deterministic_verdict = evaluate_deterministic_eligibility(candidate_profile, extracted_rules)

    return {
        "status": "success",
        "organization_name": extracted_rules.get("organization_name", "Official Notification"),
        "post_title": extracted_rules.get("post_title", "Recruitment Notification"),
        "total_vacancies": extracted_rules.get("total_vacancies", "Refer to notification"),
        "application_fee": extracted_rules.get("application_fee", "Refer to notification"),
        "important_dates": extracted_rules.get("important_dates", {}),
        "selection_process": extracted_rules.get("selection_process", ""),
        "eligibility": deterministic_verdict,
        "hidden_footnote_traps": extracted_rules.get("hidden_footnote_traps", []),
        "document_checklist": extracted_rules.get("document_checklist", []),
        "extra_syllabus_topics": extracted_rules.get("extra_syllabus_topics", []),
    }
