import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import User, Subscription, AuthUser, NotesGPTUser
from app.core.config import settings
from app.core.security import create_access_token, get_current_user_token
from app.core.rate_limit import rate_limit_handshake

router = APIRouter()


class ExtensionHandshakeRequest(BaseModel):
    email: Optional[str] = None
    device_id: Optional[str] = None
    full_name: Optional[str] = None
    client_extension_id: Optional[str] = None
    product_id: Optional[str] = "notesgpt"
    role: Optional[str] = None


class ExtensionHandshakeResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    plan: str = "trial"
    role: str = "user"
    expires_at: Optional[str] = None
    is_pro: bool = False


@router.post("/extension-token", response_model=ExtensionHandshakeResponse, dependencies=[Depends(rate_limit_handshake)])
async def extension_handshake(payload: ExtensionHandshakeRequest, db: AsyncSession = Depends(get_db)):
    """
    Chrome Extension authentication handshake.
    Retrieves or provisions the user profile (supporting registered users or guest device_id)
    and generates a signed JWT containing identity and plan claims.
    """
    # 1. Resolve identity: email or guest device_id
    if payload.email and payload.email.strip():
        clean_email = payload.email.strip().lower()
    elif payload.device_id and payload.device_id.strip():
        clean_email = f"guest_{payload.device_id.strip().lower()[:20]}@guest.aqvonx.internal"
    else:
        clean_email = f"guest_{uuid.uuid4().hex[:12]}@guest.aqvonx.internal"

    now_utc = datetime.now(timezone.utc)
    is_admin = clean_email in [e.lower() for e in settings.ADMIN_EMAILS] or payload.role == "admin"
    user_role = "admin" if is_admin else (payload.role or "user")

    if not settings.is_database_configured:
        dummy_id = str(uuid.uuid4())
        plan = "admin_lifetime" if is_admin else "trial"
        expires_at = None if is_admin else (now_utc + timedelta(days=3)).isoformat()
        token = create_access_token(
            subject=dummy_id,
            extra_claims={"email": clean_email, "is_pro": is_admin, "role": user_role, "plan": plan}
        )
        return ExtensionHandshakeResponse(
            access_token=token,
            token_type="bearer",
            user_id=dummy_id,
            email=clean_email,
            plan=plan,
            role=user_role,
            expires_at=expires_at,
            is_pro=is_admin,
        )

    try:
        # 2. Check or create primary auth_users table record
        auth_stmt = select(AuthUser).where(AuthUser.email == clean_email)
        auth_res = await db.execute(auth_stmt)
        auth_user = auth_res.scalars().first()

        if not auth_user:
            auth_user = AuthUser(
                email=clean_email,
                full_name=payload.full_name or ("Master Admin" if is_admin else f"User {clean_email.split('@')[0]}"),
                role=user_role,
                is_active=True,
                is_banned=False,
            )
            db.add(auth_user)
            await db.flush()

        if auth_user.is_banned:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended or banned.")

        # 3. Check or create NotesGPT extension user record
        notes_stmt = select(NotesGPTUser).where(NotesGPTUser.user_id == auth_user.id)
        notes_res = await db.execute(notes_stmt)
        notes_user = notes_res.scalars().first()

        if not notes_user:
            notes_user = NotesGPTUser(
                user_id=auth_user.id,
                plan_tier="pro_quarterly" if is_admin else "trial",
                trial_start_date=now_utc,
            )
            db.add(notes_user)
            await db.commit()
            await db.refresh(notes_user)

        # 4. Resolve plan, pro status, and expiration
        if is_admin or auth_user.role == "admin":
            plan = "admin_lifetime"
            is_pro = True
            expires_at_str = None
        elif notes_user.plan_tier == "trial":
            trial_start = notes_user.trial_start_date or now_utc
            if (now_utc - trial_start) > timedelta(days=3):
                plan = "trial_expired"
                is_pro = False
                expires_at_str = None
            else:
                plan = "trial"
                is_pro = False
                expires_at_str = (trial_start + timedelta(days=3)).isoformat()
        else:
            plan = notes_user.plan_tier
            is_pro = plan in ["pro_quarterly", "pro_monthly", "pro", "basic_monthly"]
            expires_at_str = notes_user.plan_expires_at.isoformat() if notes_user.plan_expires_at else None

        token = create_access_token(
            subject=str(auth_user.id),
            extra_claims={"email": auth_user.email, "is_pro": is_pro, "role": auth_user.role, "plan": plan}
        )
        return ExtensionHandshakeResponse(
            access_token=token,
            token_type="bearer",
            user_id=str(auth_user.id),
            email=auth_user.email,
            plan=plan,
            role=auth_user.role,
            expires_at=expires_at_str,
            is_pro=is_pro,
        )

        # 2. Fallback to legacy users table
        stmt = select(User).where(User.email == payload.email)
        result = await db.execute(stmt)
        user = result.scalars().first()

        if not user:
            user = User(
                email=payload.email,
                full_name=payload.full_name or payload.email.split("@")[0],
                is_active=True,
                is_banned=False,
            )
            db.add(user)
            await db.flush()

            # Create default free subscription
            free_sub = Subscription(
                user_id=user.id,
                product_id=payload.product_id or "notesgpt",
                plan_tier="free",
                status="active",
            )
            db.add(free_sub)
            await db.commit()
            await db.refresh(user)

        if user.is_banned:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended.")

        # Check pro status
        sub_stmt = select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.status == "active",
            Subscription.plan_tier.in_(["pro_monthly", "pro_annual"])
        )
        sub_res = await db.execute(sub_stmt)
        pro_sub = sub_res.scalars().first()
        is_pro = pro_sub is not None

        user_role = getattr(user, "role", "user") or "user"
        token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email, "is_pro": is_pro, "role": user_role}
        )

        return ExtensionHandshakeResponse(
            access_token=token,
            user_id=str(user.id),
            email=user.email,
            is_pro=is_pro,
            role=user_role,
        )

    except HTTPException:
        raise
    except Exception:
        # Graceful fallback on connection drop
        dummy_id = str(uuid.uuid4())
        user_role = "admin" if clean_email in settings.ADMIN_EMAILS else "user"
        token = create_access_token(
            subject=dummy_id,
            extra_claims={"email": clean_email, "is_pro": False, "role": user_role}
        )
        return ExtensionHandshakeResponse(
            access_token=token,
            user_id=dummy_id,
            email=clean_email,
            is_pro=False,
            role=user_role,
        )


@router.get("/me")
async def get_current_user(token_data: dict = Depends(get_current_user_token), db: AsyncSession = Depends(get_db)):
    user_id = token_data.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if not settings.is_database_configured:
        return {"id": user_id, "email": token_data.get("email"), "is_active": True, "mode": "sandbox"}

    try:
        user_uuid = uuid.UUID(user_id)
        stmt = select(User).where(User.id == user_uuid)
        res = await db.execute(stmt)
        user = res.scalars().first()
        if not user:
            return {"id": user_id, "email": token_data.get("email"), "is_active": True}
        return {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    except Exception:
        return {"id": user_id, "email": token_data.get("email"), "is_active": True}
