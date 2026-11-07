-- ==============================================================================
-- AQVONX Intelligence Hub - Database Schema (Neon PostgreSQL)
-- Multi-Product Subscriptions, User Profiles, and Daily Quotas
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Multi-Product Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL, -- 'notesgpt', 'portalsnap', 'editoriallens'
    plan_tier VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'pro_monthly', 'pro_annual'
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active', 'canceled', 'expired'
    expires_at TIMESTAMP WITH TIME ZONE,
    gateway VARCHAR(30), -- 'razorpay' | 'lemonsqueezy'
    subscription_id VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Daily Usage Tracker (Prevents Client-Side Limit Bypassing)
CREATE TABLE IF NOT EXISTS daily_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INT DEFAULT 1,
    CONSTRAINT unique_user_product_day UNIQUE(user_id, product_id, usage_date)
);

-- 4. Processed Webhooks Idempotency Ledger
CREATE TABLE IF NOT EXISTS processed_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for sub-50ms token lookup & quota enforcement
CREATE INDEX IF NOT EXISTS idx_subscriptions_lookup ON subscriptions(user_id, product_id, status);
CREATE INDEX IF NOT EXISTS idx_usage_lookup ON daily_usage(user_id, product_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event ON processed_webhooks(event_id);


