import uuid
from datetime import datetime, date, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    role = Column(String(20), default="user", nullable=False)  # 'user' | 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    daily_usages = relationship("DailyUsage", back_populates="user", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(50), nullable=False)  # 'notesgpt', 'portalsnap', 'editoriallens'
    plan_tier = Column(String(20), default="free", nullable=False)  # 'free', 'pro_monthly', 'pro_annual'
    status = Column(String(20), default="active", nullable=False)  # 'active', 'canceled', 'expired'
    expires_at = Column(DateTime(timezone=True), nullable=True)
    gateway = Column(String(30), nullable=True)  # 'razorpay' | 'lemonsqueezy'
    subscription_id = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="subscriptions")

    __table_args__ = (
        Index("idx_subscriptions_lookup", "user_id", "product_id", "status"),
    )


class DailyUsage(Base):
    __tablename__ = "daily_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(50), nullable=False)
    usage_date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
    request_count = Column(Integer, default=1, nullable=False)

    user = relationship("User", back_populates="daily_usages")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", "usage_date", name="unique_user_product_day"),
        Index("idx_usage_lookup", "user_id", "product_id", "usage_date"),
    )


class AuthUser(Base):
    __tablename__ = "auth_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    full_name = Column(String(150), nullable=True)
    role = Column(String(20), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    notesgpt_user = relationship("NotesGPTUser", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notesgpt_usages = relationship("NotesGPTUsage", back_populates="user", cascade="all, delete-orphan")
    notesgpt_subscriptions = relationship("NotesGPTSubscription", back_populates="user", cascade="all, delete-orphan")
    portalsnap_user = relationship("PortalSnapUser", back_populates="user", uselist=False, cascade="all, delete-orphan")
    portalsnap_usages = relationship("PortalSnapUsage", back_populates="user", cascade="all, delete-orphan")


class NotesGPTUser(Base):
    __tablename__ = "notesgpt_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_tier = Column(String(30), default="trial", nullable=False)  # 'trial' | 'basic_monthly' | 'pro_quarterly'
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)
    trial_start_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("AuthUser", back_populates="notesgpt_user")


class NotesGPTUsage(Base):
    __tablename__ = "notesgpt_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    usage_date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
    active_seconds = Column(Integer, default=0, nullable=False)
    notes_generated = Column(Integer, default=0, nullable=False)

    user = relationship("AuthUser", back_populates="notesgpt_usages")

    __table_args__ = (
        UniqueConstraint("user_id", "usage_date", name="unique_notesgpt_user_usage_date"),
        Index("idx_notesgpt_usage_lookup", "user_id", "usage_date"),
    )


class NotesGPTSubscription(Base):
    __tablename__ = "notesgpt_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    gateway_payment_id = Column(String(100), nullable=True)
    plan_type = Column(String(30), nullable=True)
    amount_usd = Column(Numeric(6, 2), nullable=True)
    status = Column(String(25), default="active", nullable=False)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("AuthUser", back_populates="notesgpt_subscriptions")

    __table_args__ = (
        Index("idx_notesgpt_subscriptions_user", "user_id", "status"),
    )


class ProcessedWebhook(Base):
    __tablename__ = "processed_webhooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(String(255), unique=True, nullable=False, index=True)
    gateway = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class PortalSnapUser(Base):
    __tablename__ = "portalsnap_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_tier = Column(String(30), default="trial", nullable=False)  # 'trial' | 'basic_monthly' | 'pro_quarterly'
    scans_this_month = Column(Integer, default=0, nullable=False)
    last_reset_month = Column(String(7), default=lambda: datetime.now(timezone.utc).strftime("%Y-%m"), nullable=False)
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("AuthUser", back_populates="portalsnap_user")


class PortalSnapUsage(Base):
    __tablename__ = "portalsnap_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    scan_date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
    pdf_name = Column(String(255), nullable=True)
    organization_name = Column(String(255), nullable=True)
    verdict = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("AuthUser", back_populates="portalsnap_usages")



