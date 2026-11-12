import json
import logging
import re
from typing import Optional, Dict, Any, List
import httpx
try:
    from fastapi import HTTPException, status
except ImportError:
    class HTTPException(Exception):  # type: ignore
        def __init__(self, status_code: int = 500, detail: str = ""):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail
    class status:  # type: ignore
        HTTP_500_INTERNAL_SERVER_ERROR = 500
        HTTP_502_BAD_GATEWAY = 502
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        # Candidate model hierarchy: start with gemini-2.5-flash and automatically cascade down
        self.candidate_models = [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
        ]

    def _get_url(self, model: str) -> str:
        return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    def clean_markdown_output(self, text: str) -> str:
        """Strips system instruction echo and preamble from the generated notes."""
        if not text:
            return ""
        cleaned = text.strip()
        unwanted_prefixes = [
            "You are NotesGPT, an expert university-level Computer Science AI note architect.",
            "You are NotesGPT, an expert university-level Computer Science AI note architect",
            "You are NotesGPT",
            "You are AQVONX Notes Engine, an advanced AI technical knowledge distiller.",
            "You are AQVONX Notes Engine",
        ]
        for prefix in unwanted_prefixes:
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):].lstrip("\n:.- ")
        return cleaned.strip()

    async def generate_notes(
        self,
        transcript_window: str = "",
        frame_base64: Optional[str] = None,
        lang: str = "en",
        include_mindmap: bool = True,
        parts: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Generate structured Markdown summary, key takeaways, and an SVG flowchart
        using Google Gemini REST API without exposing server credentials to client extensions.
        """
        # 1. Require real Gemini API key
        if not settings.is_gemini_configured or not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GEMINI_API_KEY is not configured on the backend server. Please configure a valid Gemini API key in environment variables.",
            )

        # 2. Build or forward request payload
        is_custom_parts = bool(parts and len(parts) > 0)

        if is_custom_parts:
            # Normalize extension-provided parts
            normalized_parts: List[Dict[str, Any]] = []
            has_image = False

            for p in parts:
                if not isinstance(p, dict):
                    continue
                # Handle text
                if "text" in p:
                    normalized_parts.append({"text": str(p["text"])})
                # Handle inlineData (camelCase)
                elif "inlineData" in p and isinstance(p["inlineData"], dict):
                    has_image = True
                    normalized_parts.append({
                        "inlineData": {
                            "mimeType": p["inlineData"].get("mimeType", "image/jpeg"),
                            "data": p["inlineData"].get("data", ""),
                        }
                    })
                # Handle inline_data (snake_case)
                elif "inline_data" in p and isinstance(p["inline_data"], dict):
                    has_image = True
                    normalized_parts.append({
                        "inlineData": {
                            "mimeType": p["inline_data"].get("mime_type", "image/jpeg"),
                            "data": p["inline_data"].get("data", ""),
                        }
                    })

            # Append frame_base64 if not already present in parts
            if frame_base64 and not has_image:
                clean_b64 = frame_base64
                mime_type = "image/jpeg"
                if "data:" in clean_b64 and ";base64," in clean_b64:
                    header, clean_b64 = clean_b64.split(";base64,", 1)
                    mime_type = header.replace("data:", "")
                normalized_parts.append({
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": clean_b64,
                    }
                })

            request_body: Dict[str, Any] = {
                "contents": [
                    {
                        "parts": normalized_parts
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                }
            }
        else:
            # Standard transcript synthesis prompt
            sanitized_transcript = transcript_window.replace("</TRANSCRIPT_WINDOW>", "[ESCAPED_TAG]") if transcript_window else ""

            prompt = f"""You are AQVONX Notes Engine, an advanced AI technical knowledge distiller.
Analyze the following media transcript and optional visual snapshot frame.
Target Language: {lang}

Content to process:
<TRANSCRIPT_WINDOW>
{sanitized_transcript}
</TRANSCRIPT_WINDOW>

Instructions:
1. Synthesize a clean, structured, formatted Markdown document with:
   - Clear Title & Overview
   - Key Concept Bullet Points
   - Deep Dive Details with code blocks or bulleted lists where relevant
2. Extract 3 to 5 actionable bullet takeaways.
3. {"Generate a clean, modern, standalone SVG flowchart diagram (viewBox='0 0 800 240') illustrating the core concept progression. Use a dark theme with modern cyan/indigo gradients and rounded rect nodes with clear text." if include_mindmap else "Set svg_flowchart to null."}

You MUST return a valid JSON object matching this schema:
{{
  "markdown": "string formatted in Markdown",
  "key_takeaways": ["takeaway 1", "takeaway 2", "..."],
  "svg_flowchart": "<svg ...>...</svg>" or null
}}
"""
            built_parts: List[Dict[str, Any]] = [{"text": prompt}]

            if frame_base64:
                clean_b64 = frame_base64
                mime_type = "image/jpeg"
                if "data:" in clean_b64 and ";base64," in clean_b64:
                    header, clean_b64 = clean_b64.split(";base64,", 1)
                    mime_type = header.replace("data:", "")
                built_parts.append({
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": clean_b64
                    }
                })

            request_body = {
                "contents": [
                    {
                        "parts": built_parts
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "response_mime_type": "application/json"
                }
            }

        # 3. Model Fallback Chain via httpx.AsyncClient
        last_error = ""
        async with httpx.AsyncClient(timeout=40.0) as client:
            for model in self.candidate_models:
                url = self._get_url(model)
                try:
                    response = await client.post(
                        url,
                        params={"key": self.api_key},
                        json=request_body,
                        headers={"Content-Type": "application/json"}
                    )

                    if response.status_code == 200:
                        result_json = response.json()
                        candidates = result_json.get("candidates", [])
                        if not candidates or "content" not in candidates[0]:
                            last_error = f"Model {model} returned empty candidates"
                            continue

                        raw_text = candidates[0]["content"]["parts"][0].get("text", "")

                        # Parse output (JSON or raw Markdown)
                        markdown_out = ""
                        takeaways: List[str] = []
                        svg_out: Optional[str] = None

                        clean_text = raw_text.strip()
                        if clean_text.startswith("```json"):
                            clean_text = clean_text[7:]
                        elif clean_text.startswith("```"):
                            clean_text = clean_text[3:]
                        if clean_text.endswith("```"):
                            clean_text = clean_text[:-3]
                        clean_text = clean_text.strip()

                        try:
                            parsed = json.loads(clean_text)
                            if isinstance(parsed, dict) and "markdown" in parsed:
                                markdown_out = parsed.get("markdown", "")
                                takeaways = parsed.get("key_takeaways", [])
                                svg_out = parsed.get("svg_flowchart")
                            elif isinstance(parsed, dict) and "text" in parsed:
                                markdown_out = parsed.get("text", "")
                            elif isinstance(parsed, dict) and "summary" in parsed:
                                markdown_out = parsed.get("summary", "")
                                takeaways = parsed.get("key_takeaways", [])
                            else:
                                markdown_out = raw_text
                        except Exception:
                            markdown_out = raw_text

                        # Clean any echoed system instructions
                        markdown_out = self.clean_markdown_output(markdown_out)

                        # Extract SVG if embedded in markdown
                        if not svg_out and "<svg" in markdown_out and "</svg>" in markdown_out:
                            s_idx = markdown_out.find("<svg")
                            e_idx = markdown_out.find("</svg>") + len("</svg>")
                            svg_out = markdown_out[s_idx:e_idx]

                        # Extract takeaways if empty
                        if not takeaways and markdown_out:
                            lines = [
                                l.strip("-* ").strip()
                                for l in markdown_out.split("\n")
                                if l.strip().startswith(("-", "*")) and len(l.strip()) > 8
                            ]
                            takeaways = lines[:4]

                        return {
                            "markdown": markdown_out,
                            "key_takeaways": takeaways,
                            "svg_flowchart": svg_out,
                            "model_used": model
                        }

                    elif response.status_code in [404, 429, 500, 503]:
                        logger.warning(f"Gemini model {model} HTTP {response.status_code}: {response.text[:120]}")
                        last_error = f"Model {model} HTTP {response.status_code}: {response.text[:120]}"
                        continue
                    else:
                        logger.error(f"Gemini API returned unhandled error {response.status_code}: {response.text}")
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Google Gemini API error ({response.status_code}): {response.text[:300]}"
                        )

                except httpx.RequestError as e:
                    logger.warning(f"Request error for model {model}: {e}")
                    last_error = str(e)
                    continue

        # If all candidate models fail
        logger.error(f"All Gemini models exhausted. Last error: {last_error}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google Gemini upstream models failed: {last_error or 'All model requests failed or timed out.'}"
        )


gemini_service = GeminiService()
