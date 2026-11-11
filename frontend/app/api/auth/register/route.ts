import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "developer@aqvonx.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password, confirmPassword } = body;

    // 1. Input Validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = (fullName || cleanEmail.split("@")[0]).trim();

    const sql = getDb();

    // 2. Check if user already exists
    const existing = await sql`
      SELECT id, email, password_hash
      FROM auth_users
      WHERE LOWER(email) = LOWER(${cleanEmail})
      LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // 3. Hash password using bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Role assignment (strictly check ADMIN_EMAILS)
    const assignedRole = ADMIN_EMAILS.includes(cleanEmail) ? "admin" : "user";

    // 5. Insert new user into auth_users
    const createdUsers = await sql`
      INSERT INTO auth_users (
        email, 
        password_hash, 
        full_name, 
        role, 
        is_active, 
        is_banned
      )
      VALUES (
        ${cleanEmail}, 
        ${passwordHash}, 
        ${cleanFullName}, 
        ${assignedRole}, 
        TRUE, 
        FALSE
      )
      RETURNING id, email, full_name, role;
    `;

    const newUser = createdUsers[0];

    // 6. Initialize trial record in notesgpt_users
    await sql`
      INSERT INTO notesgpt_users (
        user_id, 
        plan_tier, 
        trial_start_date
      )
      VALUES (
        ${newUser.id}, 
        'trial', 
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
    `;

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.full_name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
