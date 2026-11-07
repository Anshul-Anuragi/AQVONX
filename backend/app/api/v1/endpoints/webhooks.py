import hashlib
import hmac
import json
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.db.session import get_db
from app.db.models import User, Subscription

router = APIRouter()


@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handles Razorpay Webhooks (e.g. payment.captured, subscription.activated)
    """
    raw_body = await request.body()

    # Signature verification
    if settings.RAZORPAY_WEBHOOK_SECRET and settings.RAZORPAY_WEBHOOK_SECRET != "whsec_xxxx":
        expected_sig = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        if expected_sig != x_razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    data = await request.json()
    event = data.get("event")

    if event in ["payment.captured", "subscription.activated", "order.paid"]:
        payload = data.get("payload", {})
        payment = payload.get("payment", {}).get("entity", {})
        email = payment.get("email")
        notes = payment.get("notes", {})
        product_id = notes.get("product_id", "notesgpt")
        plan_tier = notes.get("plan_tier", "pro_monthly")

        if email:
            stmt = select(User).where(User.email == email)
            res = await db.execute(stmt)
            user = res.scalars().first()

            if user:
                # Upsert subscription
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
                        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
                    )
                    db.add(sub)
                else:
                    sub.plan_tier = plan_tier
                    sub.status = "active"
                    sub.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
                await db.commit()

    return {"status": "ok", "event": event}


@router.post("/lemonsqueezy")
async def lemonsqueezy_webhook(
    request: Request,
    x_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handles LemonSqueezy Webhooks (subscription_created, order_created, etc.)
    """
    raw_body = await request.body()

    if settings.LEMONSQUEEZY_WEBHOOK_SECRET and settings.LEMONSQUEEZY_WEBHOOK_SECRET != "lmsq_whsec_xxxx":
        digest = hmac.new(
            settings.LEMONSQUEEZY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(digest, x_signature or ""):
            raise HTTPException(status_code=400, detail="Invalid LemonSqueezy signature")

    data = await request.json()
    event_name = data.get("meta", {}).get("event_name")
    custom_data = data.get("meta", {}).get("custom_data", {})
    user_email = custom_data.get("user_email")
    product_id = custom_data.get("product_id", "notesgpt")

    if event_name in ["order_created", "subscription_created", "subscription_resumed"]:
        if user_email:
            stmt = select(User).where(User.email == user_email)
            res = await db.execute(stmt)
            user = res.scalars().first()
            if user:
                sub = Subscription(
                    user_id=user.id,
                    product_id=product_id,
                    plan_tier="pro_monthly",
                    status="active",
                    gateway="lemonsqueezy",
                    expires_at=datetime.now(timezone.utc) + timedelta(days=30),
                )
                db.add(sub)
                await db.commit()

    return {"status": "ok", "event": event_name}

