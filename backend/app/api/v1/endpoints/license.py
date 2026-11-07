import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import User, Subscription, DailyUsage
from app.core.config import settings
from app.core.security import decode_token
from app.core.rate_limit import rate_limit_handshake

router = APIRouter()


class LicenseVerifyRequest(BaseModel):
    user_token: str
    product_id: str = "notesgpt"


class LicenseVerifyResponse(BaseModel):
    is_pro: bool
    plan_tier: str
    daily_remaining: int
    daily_limit: int
    expires_at: Optional[str] = None
    user_id: Optional[str] = None
    email: Optional[str] = None


@router.post("/verify", response_model=LicenseVerifyResponse, dependencies=[Depends(rate_limit_handshake)])
async def verify_license(payload: LicenseVerifyRequest, db: AsyncSession = Depends(get_db)):
    """
    Verifies subscription status and daily usage quota for an extension client.
    Supports clean token or 'Bearer <token>' strings.
    """
    token_data = decode_token(payload.user_token)
    user_id_str = token_data.get("sub")
    email = token_data.get("email")

    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identity",
        )

    # Sandbox / unconfigured database mode
    if not settings.is_database_configured:
        is_pro = bool(token_data.get("is_pro", False))
        daily_limit = settings.PRO_TIER_DAILY_LIMIT if is_pro else settings.FREE_TIER_DAILY_LIMIT
        return LicenseVerifyResponse(
            is_pro=is_pro,
            plan_tier="pro_monthly" if is_pro else "free",
            daily_remaining=daily_limit,
            daily_limit=daily_limit,
            expires_at=None,
            user_id=user_id_str,
            email=email,
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
        today = datetime.now(timezone.utc).date()

        # Check subscription
        sub_stmt = select(Subscription).where(
            Subscription.user_id == user_uuid,
            Subscription.product_id == payload.product_id,
            Subscription.status == "active",
        ).order_by(Subscription.created_at.desc())
        sub_result = await db.execute(sub_stmt)
        subscription = sub_result.scalars().first()

        plan_tier = subscription.plan_tier if subscription else "free"
        is_pro = plan_tier in ["pro_monthly", "pro_annual"]
        daily_limit = settings.PRO_TIER_DAILY_LIMIT if is_pro else settings.FREE_TIER_DAILY_LIMIT

        # Check daily usage
        usage_stmt = select(DailyUsage).where(
            DailyUsage.user_id == user_uuid,
            DailyUsage.product_id == payload.product_id,
            DailyUsage.usage_date == today,
        )
        usage_res = await db.execute(usage_stmt)
        usage = usage_res.scalars().first()
        used = usage.request_count if usage else 0
        remaining = max(0, daily_limit - used)

        expires_at_str = subscription.expires_at.isoformat() if (subscription and subscription.expires_at) else None

        return LicenseVerifyResponse(
            is_pro=is_pro,
            plan_tier=plan_tier,
            daily_remaining=remaining,
            daily_limit=daily_limit,
            expires_at=expires_at_str,
            user_id=user_id_str,
            email=email,
        )

    except Exception:
        # Graceful fallback on connection drop
        is_pro = bool(token_data.get("is_pro", False))
        daily_limit = settings.PRO_TIER_DAILY_LIMIT if is_pro else settings.FREE_TIER_DAILY_LIMIT
        return LicenseVerifyResponse(
            is_pro=is_pro,
            plan_tier="pro_monthly" if is_pro else "free",
            daily_remaining=daily_limit,
            daily_limit=daily_limit,
            expires_at=None,
            user_id=user_id_str,
            email=email,
        )
