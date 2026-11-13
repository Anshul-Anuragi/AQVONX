import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Header, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import AuthUser, BidSniperUser
from app.core.config import settings
from app.core.security import get_current_user_token
from app.services.bidsniper_engine import run_bidsniper_multi_agent_pipeline

router = APIRouter()


class BidSniperAnalyzeRequest(BaseModel):
    job_title: str = Field(..., max_length=500, description="Title of the freelance project or job post")
    job_description: str = Field(..., max_length=30000, description="Full job post description and client requirements")
    reviews_list: List[str] = Field(default_factory=list, description="Past freelancer feedback text left on client profile")
    client_stats: Dict[str, Any] = Field(default_factory=dict, description="Client metrics (hire_rate, avg_hourly_rate, payment_verified, etc.)")
    screening_questions: List[str] = Field(default_factory=list, description="Specific screening questions asked by the client")
    portfolio_items: List[Dict[str, Any]] = Field(default_factory=list, description="Freelancer saved portfolio projects to match")
    proposal_tone: str = Field(default="Technical Architect", max_length=100, description="Proposal style or tone")
    source_url: Optional[str] = Field(default="", max_length=2000, description="URL to the job post")


@router.post("/analyze")
async def analyze_job_and_generate_proposal(
    payload: BidSniperAnalyzeRequest,
    response: Response,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db),
    x_extension_id: Optional[str] = Header(None, alias="X-Extension-ID"),
):
    """
    BidSniper AI Multi-Agent Proposal & Intel Engine:
    1. Validates Hardware-Bound Bearer JWT.
    2. Enforces free vs pro monthly limits on bidsniper_users (5 proposals/mo on free trial).
    3. Runs deterministic client detective (first name regex extraction, red-flag scan, 0-100 deal health score).
    4. Runs portfolio RAG matcher against job technical stack.
    5. Calls Gemini model cascade to generate high-converting anti-AI proposal, screening answers, and 4-layer architecture blueprint.
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

    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
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
    remaining_this_month = 9999 if is_pro else 5

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

            bs_stmt = select(BidSniperUser).where(BidSniperUser.user_id == user_uuid)
            bs_res = await db.execute(bs_stmt)
            bs_user = bs_res.scalars().first()

            if not bs_user:
                bs_user = BidSniperUser(
                    user_id=user_uuid,
                    plan_tier="free_trial",
                    proposals_this_month=0,
                    last_reset_month=current_month,
                )
                db.add(bs_user)
                await db.flush()

            # Monthly quota reset
            if bs_user.last_reset_month != current_month:
                bs_user.proposals_this_month = 0
                bs_user.last_reset_month = current_month

            # Check subscription plan in DB
            if bs_user.plan_tier in ["basic_monthly", "pro_quarterly", "pro"]:
                if not bs_user.plan_expires_at or bs_user.plan_expires_at > datetime.now(timezone.utc):
                    is_pro = True
                    plan_tier = bs_user.plan_tier
                    remaining_this_month = 9999

            if not is_pro:
                if bs_user.proposals_this_month >= 5:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail="Monthly free limit of 5 BidSniper scans reached. Upgrade to BidSniper Pro ($19/mo) for unlimited proposals & architecture diagrams.",
                    )
                bs_user.proposals_this_month += 1
                remaining_this_month = max(0, 5 - bs_user.proposals_this_month)

            await db.commit()

        except HTTPException:
            raise
        except Exception:
            pass

    try:
        synthesis = await run_bidsniper_multi_agent_pipeline(
            job_title=payload.job_title,
            job_description=payload.job_description,
            reviews_list=payload.reviews_list,
            client_stats=payload.client_stats,
            screening_questions=payload.screening_questions,
            portfolio_items=payload.portfolio_items,
            proposal_tone=payload.proposal_tone,
            source_url=payload.source_url or "",
        )
        synthesis["remaining_this_month"] = remaining_this_month
        synthesis["plan_tier"] = plan_tier
        return synthesis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"BidSniper proposal synthesis failed: {str(e)}",
        )
