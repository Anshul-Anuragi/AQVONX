import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import User, Subscription, DailyUsage, AuthUser, NotesGPTUser, NotesGPTUsage
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


class UserStatusRequest(BaseModel):
    email: EmailStr
    product_id: Optional[str] = "notesgpt"


class UserStatusResponse(BaseModel):
    user_id: str
    email: str
    role: str
    plan_tier: str
    status_label: str
    is_pro: bool
    plan_expires_at: Optional[str] = None
    trial_start_date: Optional[str] = None
    trial_days_remaining: int = 0
    daily_remaining_seconds: int = 1200
    daily_limit_seconds: int = 1200


@router.post("/user-status", response_model=UserStatusResponse)
async def get_user_status(payload: UserStatusRequest, db: AsyncSession = Depends(get_db)):
    """
    Returns accurate subscription state and active quota for dashboard and client extensions:
    - Admin lifetime privileges (developer@aqvonx.com / ADMIN_EMAILS)
    - Trial Active (3-day period, 20 min/day)
    - Trial Expired (after 3 days)
    - Basic Monthly Active
    - Pro Quarterly Active
    """
    clean_email = payload.email.strip().lower()
    is_admin_email = clean_email in [e.lower() for e in settings.ADMIN_EMAILS]

    # Admin Lifetime Privileges
    if is_admin_email:
        return UserStatusResponse(
            user_id="admin-master",
            email=clean_email,
            role="admin",
            plan_tier="lifetime_admin",
            status_label="Active (Permanent)",
            is_pro=True,
            plan_expires_at=None,
            trial_start_date=None,
            trial_days_remaining=9999,
            daily_remaining_seconds=-1,
            daily_limit_seconds=-1,
        )

    now_utc = datetime.now(timezone.utc)

    # Sandbox / unconfigured database fallback
    if not settings.is_database_configured:
        return UserStatusResponse(
            user_id=f"sandbox_{clean_email.split('@')[0]}",
            email=clean_email,
            role="user",
            plan_tier="trial",
            status_label="3-Day Free Trial",
            is_pro=False,
            plan_expires_at=(now_utc + timedelta(days=3)).isoformat(),
            trial_start_date=now_utc.isoformat(),
            trial_days_remaining=3,
            daily_remaining_seconds=1200,
            daily_limit_seconds=1200,
        )

    try:
        # 1. Fetch or create AuthUser
        auth_stmt = select(AuthUser).where(AuthUser.email == clean_email)
        auth_res = await db.execute(auth_stmt)
        auth_user = auth_res.scalars().first()

        if not auth_user:
            auth_user = AuthUser(
                email=clean_email,
                full_name=clean_email.split("@")[0].capitalize(),
                role="user",
                is_active=True,
                is_banned=False,
            )
            db.add(auth_user)
            await db.flush()

        if auth_user.role == "admin":
            return UserStatusResponse(
                user_id=str(auth_user.id),
                email=clean_email,
                role="admin",
                plan_tier="lifetime_admin",
                status_label="Active (Permanent)",
                is_pro=True,
                plan_expires_at=None,
                trial_start_date=None,
                trial_days_remaining=9999,
                daily_remaining_seconds=-1,
                daily_limit_seconds=-1,
            )

        # 2. Fetch or create NotesGPTUser
        notes_stmt = select(NotesGPTUser).where(NotesGPTUser.user_id == auth_user.id)
        notes_res = await db.execute(notes_stmt)
        notes_user = notes_res.scalars().first()

        if not notes_user:
            notes_user = NotesGPTUser(
                user_id=auth_user.id,
                plan_tier="trial",
                trial_start_date=now_utc,
            )
            db.add(notes_user)
            await db.commit()
            await db.refresh(notes_user)

        plan_tier = notes_user.plan_tier or "trial"
        trial_days_left = 0
        status_label = "Active"
        is_pro = False

        if plan_tier == "trial":
            trial_start = notes_user.trial_start_date or now_utc
            elapsed = now_utc - trial_start
            if elapsed > timedelta(days=3):
                plan_tier = "trial_expired"
                status_label = "Trial Expired"
                trial_days_left = 0
            else:
                days_left = max(1, 3 - elapsed.days)
                trial_days_left = days_left
                status_label = "3-Day Free Trial"
        elif plan_tier == "basic_monthly":
            if notes_user.plan_expires_at and notes_user.plan_expires_at < now_utc:
                plan_tier = "trial_expired"
                status_label = "Basic Expired"
            else:
                status_label = "Basic Active"
                is_pro = True
        elif plan_tier in ["pro_quarterly", "pro_monthly", "pro"]:
            if notes_user.plan_expires_at and notes_user.plan_expires_at < now_utc:
                plan_tier = "trial_expired"
                status_label = "Pro Expired"
            else:
                plan_tier = "pro_quarterly"
                status_label = "Pro Active"
                is_pro = True

        # 3. Usage tracking
        today = now_utc.date()
        usage_stmt = select(NotesGPTUsage).where(
            NotesGPTUsage.user_id == auth_user.id,
            NotesGPTUsage.usage_date == today,
        )
        usage_res = await db.execute(usage_stmt)
        usage = usage_res.scalars().first()

        used_secs = usage.active_seconds if usage else 0
        limit_secs = 1200 if plan_tier in ["trial", "trial_expired"] else 86400
        remaining_secs = 0 if plan_tier == "trial_expired" else max(0, limit_secs - used_secs)

        expires_at_str = notes_user.plan_expires_at.isoformat() if notes_user.plan_expires_at else None
        trial_start_str = notes_user.trial_start_date.isoformat() if notes_user.trial_start_date else None

        return UserStatusResponse(
            user_id=str(auth_user.id),
            email=auth_user.email,
            role=auth_user.role,
            plan_tier=plan_tier,
            status_label=status_label,
            is_pro=is_pro,
            plan_expires_at=expires_at_str,
            trial_start_date=trial_start_str,
            trial_days_remaining=trial_days_left,
            daily_remaining_seconds=remaining_secs,
            daily_limit_seconds=limit_secs,
        )

    except Exception:
        # Graceful fallback on DB interruption
        return UserStatusResponse(
            user_id=f"fallback_{clean_email.split('@')[0]}",
            email=clean_email,
            role="user",
            plan_tier="trial",
            status_label="3-Day Free Trial",
            is_pro=False,
            plan_expires_at=None,
            trial_start_date=now_utc.isoformat(),
            trial_days_remaining=3,
            daily_remaining_seconds=1200,
            daily_limit_seconds=1200,
        )


@router.get("/status", response_model=UserStatusResponse)
async def get_license_status_get(
    email: Optional[str] = Query(None),
    device_id: Optional[str] = Query(None),
    product_id: Optional[str] = Query("notesgpt"),
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    HTTP GET endpoint for subscription & quota status inspection by Chrome extensions or dashboards.
    Accepts query email, device_id, or Bearer Authorization token.
    """
    clean_email = email
    if not clean_email and authorization:
        try:
            token_data = decode_token(authorization)
            clean_email = token_data.get("email")
        except Exception:
            pass
    if not clean_email and device_id:
        clean_email = f"guest_{device_id.strip().lower()[:20]}@guest.aqvonx.internal"
    if not clean_email:
        clean_email = "guest@device.aqvonx.internal"

    req = UserStatusRequest(email=clean_email, product_id=product_id or "notesgpt")
    return await get_user_status(req, db)


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
