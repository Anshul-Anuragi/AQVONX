export type ProductId = 'notesgpt' | 'portalsnap' | 'editoriallens';

export type PlanTier = 'free' | 'pro_monthly' | 'pro_annual';

export type SubscriptionStatus = 'active' | 'canceled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  productId: ProductId | string;
  planTier: PlanTier | string;
  status: SubscriptionStatus | string;
  expiresAt: string | null;
  gateway?: 'razorpay' | 'lemonsqueezy' | null;
  subscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseVerifyRequest {
  user_token: string;
  product_id: ProductId | string;
}

export interface LicenseVerifyResponse {
  is_pro: boolean;
  plan_tier: PlanTier | string;
  daily_remaining: number;
  daily_limit: number;
  expires_at: string | null;
  user_id?: string;
  email?: string;
}

export interface DailyUsage {
  id: string;
  userId: string;
  productId: string;
  usageDate: string;
  requestCount: number;
}

