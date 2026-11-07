import hashlib
import hmac
import json
import uuid
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.db.session import get_db
from app.db.models import User, Subscription, ProcessedWebhook, AuthUser, NotesGPTUser

router = APIRouter()
logger = logging.getLogger("aqvonx.webhooks")


@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handles Razorpay Webhooks (payment.captured, subscription.activated, order.paid).
    - Verifies HMAC SHA256 signature using constant-time comparison.
    - Enforces idempotency via processed_webhooks tracking.
    """
    raw_body = await request.body()

    # Signature verification
    if settings.RAZORPAY_WEBHOOK_SECRET and settings.RAZORPAY_WEBHOOK_SECRET != "whsec_xxxx":
        if not x_razorpay_signature:
            raise HTTPException(status_code=400, detail="Missing Razorpay signature header")

        expected_sig = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, x_razorpay_signature):
            logger.warning("Razorpay webhook signature mismatch")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        data = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = data.get("event")
    event_id = data.get("payload", {}).get("payment", {}).get("entity", {}).get("id") or str(uuid.uuid4())

    # Idempotency check
    if settings.is_database_configured:
        existing_event = await db.execute(
            select(ProcessedWebhook).where(ProcessedWebhook.event_id == event_id)
        )
        if existing_event.scalars().first():
            return {"status": "duplicate", "message": "Event already processed", "event_id": event_id}

        db.add(ProcessedWebhook(event_id=event_id, gateway="razorpay"))

    if event in ["payment.captured", "subscription.activated", "order.paid"]:
        payload = data.get("payload", {})
        payment = payload.get("payment", {}).get("entity", {})
        email = payment.get("email")
        notes = payment.get("notes", {})
        product_id = notes.get("product_id", "notesgpt")
        plan_tier = notes.get("plan_tier", "pro_monthly")

        if email and settings.is_database_configured:
            clean_email = email.strip().lower()

            # 1. Update primary AuthUser / NotesGPTUser if present
            auth_user_res = await db.execute(select(AuthUser).where(AuthUser.email == clean_email))
            auth_user = auth_user_res.scalars().first()
            if auth_user:
                notes_user_res = await db.execute(
                    select(NotesGPTUser).where(NotesGPTUser.user_id == auth_user.id)
                )
                notes_user = notes_user_res.scalars().first()
                if notes_user:
                    notes_user.plan_tier = "pro_quarterly" if "quarter" in plan_tier else "pro_monthly"
                    notes_user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=90 if "quarter" in plan_tier else 30)

            # 2. Update legacy subscriptions table
            stmt = select(User).where(User.email == clean_email)
            res = await db.execute(stmt)
            user = res.scalars().first()

            if user:
                sub_stmt = select(Subscription).where(
                    Subscription.user_id == user.id,
                    Subscription.product_id == product_id
                )
                sub_res = await db.execute(sub_stmt)
                sub = sub_res.scalars().first()

                if not sub:
                    sub = Subscription(
                        user_id=user.id,
                        product_id=product_id,
                        plan_tier=plan_tier,
                        status="active",
                        gateway="razorpay",
                        subscription_id=payment.get("id"),
                        expires_at=datetime.now(timezone.utc) + timedelta(days=90 if "quarter" in plan_tier else 30),
                    )
                    db.add(sub)
                else:
                    sub.plan_tier = plan_tier
                    sub.status = "active"
                    sub.expires_at = datetime.now(timezone.utc) + timedelta(days=90 if "quarter" in plan_tier else 30)

        if settings.is_database_configured:
            await db.commit()

    return {"status": "ok", "event": event}


@router.post("/lemonsqueezy")
async def lemonsqueezy_webhook(
    request: Request,
    x_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handles LemonSqueezy Webhooks (subscription_created, order_created, etc.).
    - Verifies HMAC SHA256 signature using constant-time comparison.
    - Enforces idempotency via processed_webhooks tracking.
    """
    raw_body = await request.body()

    if settings.LEMONSQUEEZY_WEBHOOK_SECRET and settings.LEMONSQUEEZY_WEBHOOK_SECRET != "lmsq_whsec_xxxx":
        if not x_signature:
            raise HTTPException(status_code=400, detail="Missing LemonSqueezy signature header")

        digest = hmac.new(
            settings.LEMONSQUEEZY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(digest, x_signature):
            logger.warning("LemonSqueezy webhook signature mismatch")
            raise HTTPException(status_code=400, detail="Invalid LemonSqueezy signature")

    try:
        data = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_id = data.get("meta", {}).get("custom_data", {}).get("event_id") or data.get("data", {}).get("id") or str(uuid.uuid4())

    # Idempotency check
    if settings.is_database_configured:
        existing_event = await db.execute(
            select(ProcessedWebhook).where(ProcessedWebhook.event_id == event_id)
        )
        if existing_event.scalars().first():
            return {"status": "duplicate", "message": "Event already processed", "event_id": event_id}

        db.add(ProcessedWebhook(event_id=event_id, gateway="lemonsqueezy"))

    event_name = data.get("meta", {}).get("event_name")
    custom_data = data.get("meta", {}).get("custom_data", {})
    user_email = custom_data.get("user_email")
    product_id = custom_data.get("product_id", "notesgpt")

    if event_name in ["order_created", "subscription_created", "subscription_resumed"]:
        if user_email and settings.is_database_configured:
            clean_email = user_email.strip().lower()

            # 1. Update AuthUser & NotesGPTUser
            auth_user_res = await db.execute(select(AuthUser).where(AuthUser.email == clean_email))
            auth_user = auth_user_res.scalars().first()
            if auth_user:
                notes_user_res = await db.execute(
                    select(NotesGPTUser).where(NotesGPTUser.user_id == auth_user.id)
                )
                notes_user = notes_user_res.scalars().first()
                if notes_user:
                    notes_user.plan_tier = "pro_monthly"
                    notes_user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=30)

            # 2. Update legacy subscriptions table
            stmt = select(User).where(User.email == clean_email)
            res = await db.execute(stmt)
            user = res.scalars().first()
            if user:
                sub_stmt = select(Subscription).where(
                    Subscription.user_id == user.id,
                    Subscription.product_id == product_id
                )
                sub_res = await db.execute(sub_stmt)
                sub = sub_res.scalars().first()
                if not sub:
                    sub = Subscription(
                        user_id=user.id,
                        product_id=product_id,
                        plan_tier="pro_monthly",
                        status="active",
                        gateway="lemonsqueezy",
                        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
                    )
                    db.add(sub)
                else:
                    sub.plan_tier = "pro_monthly"
                    sub.status = "active"
                    sub.expires_at = datetime.now(timezone.utc) + timedelta(days=30)

        if settings.is_database_configured:
            await db.commit()

    return {"status": "ok", "event": event_name}
