import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "developer@aqvonx.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

function checkAdmin(session: any): boolean {
  if (!session?.user?.email) return false;
  const cleanEmail = session.user.email.trim().toLowerCase();
  return (
    session.user.role === "admin" ||
    ADMIN_EMAILS.includes(cleanEmail) ||
    cleanEmail === "developer@aqvonx.com"
  );
}

export async function GET() {
  const session = await auth();

  if (!checkAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const sql = getDb();

    // Query real users from auth_users joined with notesgpt_users and today's usage
    const rawUsers = await sql`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.role,
        COALESCE(u.is_banned, false) as is_banned,
        u.created_at,
        COALESCE(nu.plan_tier, 'trial') as plan_tier,
        COALESCE(usg.active_seconds, 0) as today_seconds,
        COALESCE(usg.notes_generated, 0) as today_notes
      FROM auth_users u
      LEFT JOIN notesgpt_users nu ON u.id = nu.user_id
      LEFT JOIN notesgpt_usage usg ON u.id = usg.user_id AND usg.usage_date = CURRENT_DATE
      ORDER BY u.created_at DESC
      LIMIT 100;
    `;

    const users = (rawUsers || []).map((u: any) => {
      const minutes = Math.floor((u.today_seconds || 0) / 60);
      const limitMinutes = u.plan_tier === "pro_quarterly" || u.plan_tier === "basic_monthly" ? 1440 : 20;
      return {
        id: String(u.id),
        email: u.email,
        fullName: u.full_name || "",
        extension: "NotesGPT Studio",
        plan: u.plan_tier || "trial",
        daily_usage: `${minutes} / ${limitMinutes} min`,
        notes_count: u.today_notes || 0,
        status: u.is_banned ? "banned" : "active",
        created_at: u.created_at,
      };
    });

    // Compute live metrics from real data
    const totalUsers = users.length;
    const activeSubscribers = users.filter((u: any) => u.plan === "basic_monthly" || u.plan === "pro_quarterly").length;
    const basicCount = users.filter((u: any) => u.plan === "basic_monthly").length;
    const proCount = users.filter((u: any) => u.plan === "pro_quarterly").length;
    const todayCalls = users.reduce((acc: number, curr: any) => acc + (curr.notes_count || 0), 0);
    const bannedCount = users.filter((u: any) => u.status === "banned").length;
    const mrr = (basicCount * 6.99 + proCount * (14.99 / 3)).toFixed(2);

    return NextResponse.json({
      users,
      metrics: {
        totalUsers,
        activeSubscribers,
        basicCount,
        proCount,
        todayCalls,
        bannedCount,
        mrr: `$${mrr}`,
      },
    });
  } catch (error: any) {
    console.error("Admin user directory fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live admin metrics", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!checkAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const sql = getDb();

    if (action === "toggle_ban") {
      const updated = await sql`
        UPDATE auth_users
        SET is_banned = NOT COALESCE(is_banned, false)
        WHERE id = ${userId}
        RETURNING id, email, is_banned;
      `;

      if (!updated || updated.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        user: updated[0],
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Failed to update user", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
