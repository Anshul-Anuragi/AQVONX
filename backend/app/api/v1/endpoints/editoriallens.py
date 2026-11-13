import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Header, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import AuthUser, EditorialLensUser
from app.core.config import settings
from app.core.security import get_current_user_token
from app.services.editoriallens_engine import (
    run_editoriallens_multi_agent_pipeline,
    evaluate_mains_answer,
)

router = APIRouter()


class EditorialSynthesizeRequest(BaseModel):
    title: str = Field(..., max_length=500, description="Headline or title of the editorial")
    text: str = Field(..., max_length=40000, description="Full editorial text content (max 40,000 chars)")
    url: Optional[str] = Field("", max_length=2000, description="Source article URL")
    target_exam: Optional[str] = Field("UPSC CSE", max_length=100, description="Target exam (e.g. UPSC CSE, State PSC, RBI Grade B)")


class MainsEvaluateRequest(BaseModel):
    question: str = Field(..., max_length=2000, description="Mains practice question")
    student_answer: str = Field(..., max_length=15000, description="Student's typed or OCR-extracted answer")
    context: Optional[str] = Field("", max_length=10000, description="Optional background or editorial context")


@router.post("/synthesize")
async def synthesize_editorial(
    payload: EditorialSynthesizeRequest,
    response: Response,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db),
    x_extension_id: Optional[str] = Header(None, alias="X-Extension-ID"),
):
    """
    EditorialLens 3-Stage Multi-Agent Synthesis Pipeline:
    1. Validates Hardware-Bound Bearer JWT.
    2. Enforces free vs pro daily quotas (2 free syntheses/day, auto-resetting daily).
    3. Runs deterministic GS Paper classification & keyword mapping.
    4. Fetches concurrent Constitutional Articles, SC Judgments, and Commissions via Wikipedia/Tavily.
    5. Calls Gemini model cascade to synthesize 250-word blueprint, prelims MCQs, and mains questions.
    """
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    user_id_str = token_data.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User token missing subject identity.",
        )

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    user_email = (token_data.get("email") or "").lower()
    token_role = token_data.get("role") or "user"
    token_plan = token_data.get("plan") or "free_trial"

    is_admin = (
        token_role == "admin"
        or token_plan == "admin_lifetime"
        or user_email in [e.lower() for e in settings.ADMIN_EMAILS]
    )

    is_pro = is_admin or bool(token_data.get("is_pro", False)) or token_plan in ["basic_monthly", "pro_quarterly", "pro"]
    plan_tier = "admin_lifetime" if is_admin else ("pro_quarterly" if is_pro else "free_trial")
    remaining_today = 9999 if is_pro else 2

    if settings.is_database_configured and not is_admin:
        try:
            user_uuid = uuid.UUID(user_id_str)

            auth_stmt = select(AuthUser).where(AuthUser.id == user_uuid)
            auth_res = await db.execute(auth_stmt)
            auth_user = auth_res.scalars().first()

            if auth_user and auth_user.is_banned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account suspended or banned due to policy violation.",
                )

            ed_stmt = select(EditorialLensUser).where(EditorialLensUser.user_id == user_uuid)
            ed_res = await db.execute(ed_stmt)
            ed_user = ed_res.scalars().first()

            if not ed_user:
                ed_user = EditorialLensUser(
                    user_id=user_uuid,
                    plan_tier="free_trial",
                    analyses_today=0,
                    last_reset_date=today,
                )
                db.add(ed_user)
                await db.flush()

            # Daily quota reset
            if ed_user.last_reset_date != today:
                ed_user.analyses_today = 0
                ed_user.last_reset_date = today

            # Check subscription plan in DB
            if ed_user.plan_tier in ["basic_monthly", "pro_quarterly", "pro"]:
                if not ed_user.plan_expires_at or ed_user.plan_expires_at > datetime.now(timezone.utc):
                    is_pro = True
                    plan_tier = ed_user.plan_tier
                    remaining_today = 9999

            if not is_pro:
                if ed_user.analyses_today >= 2:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail="Daily free limit of 2 editorials reached. Upgrade to EditorialLens Pro (₹199/mo) for unlimited UPSC syntheses & Mains evaluation.",
                    )
                ed_user.analyses_today += 1
                remaining_today = max(0, 2 - ed_user.analyses_today)

            await db.commit()

        except HTTPException:
            raise
        except Exception:
            pass

    try:
        synthesis = await run_editoriallens_multi_agent_pipeline(
            article_title=payload.title,
            article_text=payload.text,
            source_url=payload.url or "",
            target_exam=payload.target_exam or "UPSC CSE",
        )
        synthesis["remaining_today"] = remaining_today
        synthesis["plan_tier"] = plan_tier
        return synthesis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"EditorialLens synthesis failed: {str(e)}",
        )


@router.post("/evaluate-mains")
async def evaluate_mains(
    payload: MainsEvaluateRequest,
    response: Response,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db),
    x_extension_id: Optional[str] = Header(None, alias="X-Extension-ID"),
):
    """
    Evaluates a candidate's typed Mains practice answer out of 10 marks
    using UPSC grading criteria, checking structural flow, constitutional citations,
    committee references, and data points.
    """
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    user_id_str = token_data.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User token missing subject identity.",
        )

    if settings.is_database_configured:
        try:
            user_uuid = uuid.UUID(user_id_str)
            auth_stmt = select(AuthUser).where(AuthUser.id == user_uuid)
            auth_res = await db.execute(auth_stmt)
            auth_user = auth_res.scalars().first()
            if auth_user and auth_user.is_banned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account suspended or banned due to policy violation.",
                )
        except HTTPException:
            raise
        except Exception:
            pass

    try:
        evaluation = await evaluate_mains_answer(
            question=payload.question,
            student_answer=payload.student_answer,
            editorial_context=payload.context or "",
        )
        return evaluation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mains answer evaluation failed: {str(e)}",
        )
