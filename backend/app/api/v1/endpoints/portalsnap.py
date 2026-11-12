import base64
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.db.session import get_db
from app.db.models import AuthUser, PortalSnapUser, PortalSnapUsage
from app.core.config import settings
from app.core.security import get_current_user_token
from app.services.portalsnap_engine import run_portalsnap_multi_agent_pipeline

router = APIRouter()


class PortalSnapScanRequest(BaseModel):
    pdf_base64: Optional[str] = Field(None, description="Raw base64-encoded PDF bytes from browser (preferred, bypasses NIC WAF)")
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

            # Check plan tier in DB
            if ps_user.plan_tier in ["basic_monthly", "pro_quarterly", "pro"]:
                if ps_user.plan_expires_at and ps_user.plan_expires_at > datetime.now(timezone.utc):
                    is_pro = True
                    plan_tier = ps_user.plan_tier
                    remaining_scans = 9999

            if not is_pro:
                if ps_user.scans_this_month >= 3:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail="Monthly free limit of 3 PDF scans reached. Upgrade to PortalSnap Pro (₹99/mo) for unlimited PSU & Govt exam scans.",
                    )
                ps_user.scans_this_month += 1
                remaining_scans = max(0, 3 - ps_user.scans_this_month)

            await db.commit()

        except HTTPException:
            raise
        except Exception as e:
            # Fallback on DB drop
            pass

    # Extract raw PDF bytes
    pdf_bytes: Optional[bytes] = None

    if payload.pdf_base64:
        clean_b64 = payload.pdf_base64
        if "base64," in clean_b64:
            clean_b64 = clean_b64.split("base64,")[1]
        try:
            pdf_bytes = base64.b64decode(clean_b64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 encoding in pdf_base64 payload.",
            )
    elif payload.pdf_url:
        try:
            async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
                resp = await client.get(
                    payload.pdf_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0"}
                )
                if resp.status_code == 200:
                    pdf_bytes = resp.content
                else:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Target recruitment portal returned status {resp.status_code} when downloading notification PDF.",
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch PDF from URL: {str(e)}",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either pdf_base64 or pdf_url must be provided in request body.",
        )

    if not pdf_bytes or len(pdf_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty or corrupted PDF document stream.",
        )

    # Run the 3-stage multi-agent pipeline
    try:
        pipeline_result = await run_portalsnap_multi_agent_pipeline(
            pdf_bytes=pdf_bytes,
            candidate_profile=payload.candidate_profile,
            is_pro=is_pro,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"PortalSnap Engine processing failed: {str(e)}",
        )

    # Record scan in usage ledger if DB configured
    if settings.is_database_configured and user_id_str:
        try:
            scan_log = PortalSnapUsage(
                user_id=uuid.UUID(user_id_str),
                scan_date=datetime.now(timezone.utc).date(),
                organization_name=pipeline_result.get("organization_name", "Official Notification")[:250],
                verdict=pipeline_result.get("eligibility", {}).get("verdict_badge", "ELIGIBLE"),
            )
            db.add(scan_log)
            await db.commit()
        except Exception:
            pass

    return PortalSnapScanResponse(
        status="success",
        organization_name=pipeline_result.get("organization_name", "Official Notification"),
        post_title=pipeline_result.get("post_title", "Recruitment Notification"),
        total_vacancies=pipeline_result.get("total_vacancies", "Refer to notification"),
        application_fee=pipeline_result.get("application_fee", "Refer to notification"),
        important_dates=pipeline_result.get("important_dates", {}),
        selection_process=pipeline_result.get("selection_process", ""),
        eligibility=pipeline_result.get("eligibility", {}),
        hidden_footnote_traps=pipeline_result.get("hidden_footnote_traps", []),
        document_checklist=pipeline_result.get("document_checklist", []),
        extra_syllabus_topics=pipeline_result.get("extra_syllabus_topics", []),
        remaining_scans=remaining_scans,
        plan_tier=plan_tier,
    )
