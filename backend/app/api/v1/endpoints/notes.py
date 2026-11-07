import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import AuthUser, NotesGPTUser, NotesGPTUsage, User, Subscription, DailyUsage
from app.core.config import settings
from app.core.security import get_current_user_token
from app.services.gemini import gemini_service

router = APIRouter()


class NotesGenerateRequest(BaseModel):
    transcript_window: str = Field(..., description="Transcript snippet or audio text window to summarize")
    frame_base64: Optional[str] = Field(None, description="Optional raw base64 frame capture from video/tab")
    lang: str = Field("en", description="Target output language code (e.g. en, hi, es, fr)")
    include_mindmap: bool = Field(True, description="Whether to generate an SVG visual flowchart")
    chunk_seconds: Optional[int] = Field(45, description="Duration of the audio/video chunk in seconds")


class NotesGenerateResponse(BaseModel):
    markdown: str
    key_takeaways: List[str]
    svg_flowchart: Optional[str] = None
    daily_remaining: int
    plan_tier: str = "trial"


@router.post("/generate", response_model=NotesGenerateResponse)
async def generate_notes(
    payload: NotesGenerateRequest,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db),
    x_extension_id: Optional[str] = Header(None, alias="X-Extension-ID"),
):
    """
    Secure Server-Side Notes Generation Proxy:
    1. Validates Hardware-Bound Bearer JWT.
    2. Rejects banned accounts (HTTP 403) and tampered client extension IDs.
    3. Strictly enforces server-side quotas on notesgpt_usage & notesgpt_users:
       - If on 'trial' and active_seconds >= 1200 (20 min) today, or if trial expired (> 3 days),
         returns HTTP 402 Payment Required.
    4. Increments usage metrics atomically.
    5. Dispatches request to Google Gemini Flash API with server-side hidden key.
       The client extension NEVER receives the Gemini API key.
    """
    # 1. Anti-Tamper Extension ID Inspection
    if x_extension_id and ("unpacked_tamper" in x_extension_id.lower() or "bypass" in x_extension_id.lower()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tampered or unauthorized extension client rejected.",
        )

    # 2. JWT Identity Verification
    user_id_str = token_data.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User token missing subject identity.",
        )

    today = datetime.now(timezone.utc).date()
    now_utc = datetime.now(timezone.utc)
    plan_tier = "trial"
    daily_remaining = settings.FREE_TIER_DAILY_LIMIT

    if settings.is_database_configured:
        try:
            user_uuid = uuid.UUID(user_id_str)

            # 3. Check Account Security & Ban Status
            user_stmt = select(AuthUser).where(AuthUser.id == user_uuid)
            user_res = await db.execute(user_stmt)
            auth_user = user_res.scalars().first()

            if auth_user:
                if auth_user.is_banned:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account suspended or banned due to security violations.",
                    )
                if not auth_user.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account is currently inactive.",
                    )

            # 4. Check NotesGPT Plan Tier & Expiration
            notes_user_stmt = select(NotesGPTUser).where(NotesGPTUser.user_id == user_uuid)
            notes_user_res = await db.execute(notes_user_stmt)
            notes_user = notes_user_res.scalars().first()

            is_pro = False
            if notes_user:
                plan_tier = notes_user.plan_tier
                if plan_tier in ["pro_quarterly", "pro_monthly", "pro"]:
                    # Check plan expiration
                    if notes_user.plan_expires_at and notes_user.plan_expires_at > now_utc:
                        is_pro = True
                    else:
                        plan_tier = "trial"
                elif plan_tier == "trial":
                    # Check 3-day trial lifespan
                    trial_start = notes_user.trial_start_date or (now_utc - timedelta(days=1))
                    if (now_utc - trial_start) > timedelta(days=3):
                        raise HTTPException(
                            status_code=status.HTTP_402_PAYMENT_REQUIRED,
                            detail="Daily free limit reached or trial expired (3-day trial period ended). Upgrade to AQVONX Pro.",
                        )
            else:
                # Check legacy token claims
                is_pro = bool(token_data.get("is_pro", False))
                plan_tier = "pro_quarterly" if is_pro else "trial"

            # 5. Daily Usage Quota Enforcement (20 minutes / 1200 seconds for trial)
            usage_stmt = select(NotesGPTUsage).where(
                NotesGPTUsage.user_id == user_uuid,
                NotesGPTUsage.usage_date == today,
            )
            usage_res = await db.execute(usage_stmt)
            usage = usage_res.scalars().first()

            chunk_secs = max(15, min(payload.chunk_seconds or 45, 120))
            active_seconds = usage.active_seconds if usage else 0

            if not is_pro and active_seconds >= 1200:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Daily free limit reached or trial expired (20 minutes daily free usage exceeded). Upgrade to AQVONX Pro.",
                )

            # 6. Atomically Increment Usage
            if usage:
                usage.active_seconds += chunk_secs
                usage.notes_generated += 1
            else:
                usage = NotesGPTUsage(
                    user_id=user_uuid,
                    usage_date=today,
                    active_seconds=chunk_secs,
                    notes_generated=1,
                )
                db.add(usage)

            await db.commit()

            if is_pro:
                daily_remaining = max(0, settings.PRO_TIER_DAILY_LIMIT - (usage.notes_generated if usage else 1))
            else:
                # Seconds remaining converted to minutes
                daily_remaining = max(0, (1200 - (active_seconds + chunk_secs)) // 60)

        except HTTPException:
            raise
        except Exception:
            # Fallback for transient DB drops
            daily_remaining = settings.FREE_TIER_DAILY_LIMIT - 1

    # 7. Secure Server-Side Gemini Inference (Client NEVER sees the API Key)
    result = await gemini_service.generate_notes(
        transcript_window=payload.transcript_window,
        frame_base64=payload.frame_base64,
        lang=payload.lang,
        include_mindmap=payload.include_mindmap,
    )

    return NotesGenerateResponse(
        markdown=result.get("markdown", ""),
        key_takeaways=result.get("key_takeaways", []),
        svg_flowchart=result.get("svg_flowchart"),
        daily_remaining=daily_remaining,
        plan_tier=plan_tier,
    )
