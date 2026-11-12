import base64
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.db.session import get_db
from app.db.models import AuthUser, PortalSnapUser
from app.core.config import settings
from app.core.security import get_current_user_token
from app.services.portalsnap_engine import run_portalsnap_multi_agent_pipeline

router = APIRouter()


class PortalSnapScanRequest(BaseModel):
    pdf_base64: Optional[str] = Field(None, description="Raw base64-encoded PDF bytes from browser")
    pdf_url: Optional[str] = Field(None, max_length=2000, description="Public URL to recruitment notification PDF")
    candidate_profile: Dict[str, Any] = Field(
        default_factory=lambda: {
            "dob": "2002-05-15",
            "category": "UR",
            "branch": "CS",
            "degree": "B.Tech",
            "percentage": 75.0,
            "is_final_year": False,
        },
        description="Candidate credentials for deterministic eligibility verification",
    )


class PortalSnapScanResponse(BaseModel):
    status: str
    organization_name: str
    post_title: str
    total_vacancies: str
    application_fee: str
    important_dates: Dict[str, Any]
    selection_process: str
    eligibility: Dict[str, Any]
    hidden_footnote_traps: list
    document_checklist: list
    extra_syllabus_topics: list
    remaining_scans: int
    plan_tier: str


@router.post("/scan", response_model=PortalSnapScanResponse)
async def scan_recruitment_pdf(
    payload: PortalSnapScanRequest,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db),
    x_extension_id: Optional[str] = Header(None, alias="X-Extension-ID"),
):
    """
    PortalSnap 3-Stage Multi-Agent Eligibility Engine:
    1. Validates Hardware-Bound Bearer JWT.
    2. Enforces free vs pro monthly scan limits on portalsnap_users (3 scans/mo for trial).
    3. Streams PDF bytes into PyMuPDF page-tagged extractor.
    4. Runs Gemini structural extraction + trap hunting.
    5. Evaluates exact age & degree math deterministically.
    """
    user_id_str = token_data.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User token missing subject identity.",
        )

    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    user_email = (token_data.get("email") or "").lower()
    token_role = token_data.get("role") or "user"
    token_plan = token_data.get("plan") or "trial"

    is_admin = (
        token_role == "admin"
        or token_plan == "admin_lifetime"
        or user_email in [e.lower() for e in settings.ADMIN_EMAILS]
    )

    is_pro = is_admin or bool(token_data.get("is_pro", False)) or token_plan in ["basic_monthly", "pro_quarterly", "pro"]
    plan_tier = "admin_lifetime" if is_admin else ("pro_quarterly" if is_pro else "trial")
    remaining_scans = 9999 if is_pro else 3

    if settings.is_database_configured and not is_admin:
        try:
            user_uuid = uuid.UUID(user_id_str)

            # Check if user is banned
            auth_stmt = select(AuthUser).where(AuthUser.id == user_uuid)
            auth_res = await db.execute(auth_stmt)
            auth_user = auth_res.scalars().first()

            if auth_user and auth_user.is_banned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account suspended or banned due to policy violation.",
                )

            # Check PortalSnap quota
            ps_stmt = select(PortalSnapUser).where(PortalSnapUser.user_id == user_uuid)
            ps_res = await db.execute(ps_stmt)
            ps_user = ps_res.scalars().first()

            if not ps_user:
                ps_user = PortalSnapUser(
                    user_id=user_uuid,
                    plan_tier="trial",
                    scans_this_month=0,
                    last_reset_month=current_month,
                )
                db.add(ps_user)
                await db.flush()

            # Check month reset
            if ps_user.last_reset_month != current_month:
                ps_user.scans_this_month = 0
                ps_user.last_reset_month = current_month

            if ps_user.plan_tier in ["basic_monthly", "pro_quarterly", "pro"]:
                is_pro = True
                plan_tier = ps_user.plan_tier
                remaining_scans = 9999
            else:
                # Free Trial: 3 scans per month
                if ps_user.scans_this_month >= 3:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail="Monthly free limit of 3 PDF scans reached. Upgrade to PortalSnap Pro ($4.99/mo) for unlimited PSU & Govt exam scans.",
                    )
                ps_user.scans_this_month += 1
                remaining_scans = max(0, 3 - ps_user.scans_this_month)

            await db.commit()

        except HTTPException:
            raise
        except Exception as e:
            # Fallback if DB transient
            pass

    # Resolve PDF Bytes
    pdf_bytes: Optional[bytes] = None

    if payload.pdf_base64:
        clean_b64 = payload.pdf_base64.strip()
        if "data:application/pdf;base64," in clean_b64:
            clean_b64 = clean_b64.split("data:application/pdf;base64,", 1)[1]
        elif ";base64," in clean_b64:
            clean_b64 = clean_b64.split(";base64,", 1)[1]
        try:
            pdf_bytes = base64.b64decode(clean_b64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 encoding for PDF.",
            )
    elif payload.pdf_url:
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                resp = await client.get(payload.pdf_url)
                if resp.status_code == 200:
                    pdf_bytes = resp.content
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to fetch PDF from URL (HTTP {resp.status_code}).",
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Network error fetching PDF from URL: {str(e)}",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either pdf_base64 or a valid pdf_url must be provided.",
        )

    if not pdf_bytes or len(pdf_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty or corrupted PDF payload received.",
        )

    # Execute Multi-Agent Pipeline
    try:
        result = await run_portalsnap_multi_agent_pipeline(
            pdf_bytes=pdf_bytes,
            candidate_profile=payload.candidate_profile,
            is_pro=is_pro,
        )
        result["remaining_scans"] = remaining_scans
        result["plan_tier"] = plan_tier
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"PortalSnap Engine processing failed: {str(e)}",
        )
