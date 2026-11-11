import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "developer@aqvonx.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cleanEmail = session.user.email.trim().toLowerCase();
  const isAdmin =
    session.user.role === "admin" ||
    ADMIN_EMAILS.includes(cleanEmail) ||
    cleanEmail === "developer@aqvonx.com";

  // 1. Admin Lifetime Privileges
  if (isAdmin) {
    return NextResponse.json({
      user_id: "admin-master",
      email: cleanEmail,
      role: "admin",
      plan_tier: "lifetime_admin",
      status_label: "Active (Permanent)",
      is_pro: true,
      plan_expires_at: null,
      trial_start_date: null,
      trial_days_remaining: 9999,
      daily_remaining_seconds: -1,
      daily_limit_seconds: -1,
    });
  }

  // 2. Query Neon DB Directly
  try {
    const sql = getDb();
    const userRows = await sql`
      SELECT u.id, u.email, u.role, n.plan_tier, n.plan_expires_at, n.trial_start_date
      FROM auth_users u
      LEFT JOIN notesgpt_users n ON u.id = n.user_id
      WHERE LOWER(u.email) = LOWER(${cleanEmail})
      LIMIT 1;
    `;

    if (userRows && userRows.length > 0) {
      const u = userRows[0];
      const now = new Date();
      let planTier = u.plan_tier || "trial";
      let trialDaysLeft = 3;

      if (planTier === "trial") {
        const trialStart = u.trial_start_date ? new Date(u.trial_start_date) : now;
        const diffDays = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 3) {
          planTier = "trial_expired";
          trialDaysLeft = 0;
        } else {
          trialDaysLeft = Math.max(1, 3 - diffDays);
        }
      } else if (planTier === "basic_monthly" || planTier === "pro_quarterly") {
        if (u.plan_expires_at && new Date(u.plan_expires_at) < now) {
          planTier = "trial_expired";
        }
      }

      // Check today's usage
      const usageRows = await sql`
        SELECT active_seconds, notes_generated
        FROM notesgpt_usage
        WHERE user_id = ${u.id} AND usage_date = CURRENT_DATE
        LIMIT 1;
      `;
      const usedSecs = usageRows.length > 0 ? usageRows[0].active_seconds : 0;
      const limitSecs = (planTier === "trial" || planTier === "trial_expired") ? 1200 : 86400;
      const remainingSecs = planTier === "trial_expired" ? 0 : Math.max(0, limitSecs - usedSecs);

      return NextResponse.json({
        user_id: u.id,
        email: u.email,
        role: u.role || "user",
        plan_tier: planTier,
        status_label: planTier === "trial_expired" ? "Trial Expired" : (planTier === "trial" ? "3-Day Free Trial" : "Active"),
        is_pro: planTier === "pro_quarterly" || planTier === "basic_monthly",
        plan_expires_at: u.plan_expires_at,
        trial_start_date: u.trial_start_date,
        trial_days_remaining: trialDaysLeft,
        daily_remaining_seconds: remainingSecs,
        daily_limit_seconds: limitSecs,
      });
    }
  } catch (dbErr) {
    console.error("Direct Neon subscription query error:", dbErr);
  }

  // 3. Fallback to FastAPI Backend
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000/api/v1";

    const res = await fetch(`${apiBase}/license/user-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, product_id: "notesgpt" }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend offline / sandbox fallback
  }

  // 4. Default Safe Trial State
  return NextResponse.json({
    user_id: session.user.id || `usr_${cleanEmail.split("@")[0]}`,
    email: cleanEmail,
    role: "user",
    plan_tier: "trial",
    status_label: "3-Day Free Trial",
    is_pro: false,
    plan_expires_at: null,
    trial_start_date: new Date().toISOString(),
    trial_days_remaining: 3,
    daily_remaining_seconds: 1200,
    daily_limit_seconds: 1200,
  });
}
