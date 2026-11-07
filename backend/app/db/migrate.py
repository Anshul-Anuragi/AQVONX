"""
==============================================================================
AQVONX Automated Database Migration & Super-Admin Seeder
Neon PostgreSQL (Serverless) via SQLAlchemy 2.0 & asyncpg
==============================================================================
"""

import os
import sys
import asyncio
import argparse
import urllib.parse
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text


# Load environment variables (.env at backend root or workspace directory)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


def get_unpooled_database_url() -> str:
    """
    Retrieves and normalizes the direct unpooled connection string for schema migrations.
    DDL operations (CREATE EXTENSION, CREATE TABLE, INDEX) require direct compute
    connections, avoiding PgBouncer transaction-lock drops and timeouts.
    """
    raw_url = os.getenv("DATABASE_URL_UNPOOLED") or os.getenv("DATABASE_URL")
    if not raw_url:
        raise ValueError(
            "Neither DATABASE_URL_UNPOOLED nor DATABASE_URL was found in .env."
        )

    url = raw_url.strip()

    # For direct compute DDL operations, eliminate the pooled host if present
    if "-pooler." in url:
        url = url.replace("-pooler.", ".")

    # Normalize scheme to postgresql+asyncpg://
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    try:
        parsed = urllib.parse.urlsplit(url)
        query_params = urllib.parse.parse_qs(parsed.query)

        # Convert sslmode to ssl for asyncpg compatibility
        if "sslmode" in query_params:
            ssl_val = query_params.pop("sslmode")[0]
            if ssl_val in ["require", "verify-ca", "verify-full"]:
                query_params["ssl"] = ["require"]

        # Remove unsupported asyncpg parameters
        for param in ["channel_binding", "target_session_attrs", "gssencmode", "application_name"]:
            query_params.pop(param, None)

        new_query = urllib.parse.urlencode(query_params, doseq=True)
        return urllib.parse.urlunsplit(
            (parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment)
        )
    except Exception:
        return url


# DDL Schema definitions
SCHEMA_STATEMENTS = [
    # 1. Enable Cryptographic & UUID generation extensions
    """
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    """,
    # 2. Base Authentication & User Profiles Table
    """
    CREATE TABLE IF NOT EXISTS auth_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(150),
        role VARCHAR(20) DEFAULT 'user' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        is_banned BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    """,
    # 3. NotesGPT Extension Users Table
    """
    CREATE TABLE IF NOT EXISTS notesgpt_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
        plan_tier VARCHAR(30) DEFAULT 'trial' NOT NULL,
        plan_expires_at TIMESTAMPTZ,
        trial_start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    """,
    # 4. Daily Usage & Active Seconds Tracking Table
    """
    CREATE TABLE IF NOT EXISTS notesgpt_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        usage_date DATE DEFAULT CURRENT_DATE NOT NULL,
        active_seconds INT DEFAULT 0 NOT NULL,
        notes_generated INT DEFAULT 0 NOT NULL,
        CONSTRAINT unique_user_usage_date UNIQUE(user_id, usage_date)
    );
    """,
    # 5. Multi-Product Subscriptions & Payments Table
    """
    CREATE TABLE IF NOT EXISTS notesgpt_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        gateway_payment_id VARCHAR(100),
        plan_type VARCHAR(30),
        amount_usd NUMERIC(6, 2),
        status VARCHAR(25) DEFAULT 'active' NOT NULL,
        started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        ends_at TIMESTAMPTZ
    );
    """,
    # 6. Performance Indexing
    """
    CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_notesgpt_usage_lookup ON notesgpt_usage(user_id, usage_date);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_notesgpt_subscriptions_user ON notesgpt_subscriptions(user_id, status);
    """,
]


async def run_migrations(admin_email: str, admin_name: str = "Super Admin"):
    """
    Executes asynchronous DDL statements and seeds the initial super-admin account.
    """
    db_url = get_unpooled_database_url()

    # Mask host and user for logging
    parsed = urllib.parse.urlsplit(db_url)
    user_part = parsed.username or "unknown_user"
    masked_netloc = parsed.netloc.split("@")[-1] if "@" in parsed.netloc else parsed.netloc

    print("=================================================================")
    print(" AQVONX DATABASE MIGRATION & SEED ENGINE (Neon PostgreSQL)")
    print("=================================================================")
    print(f"[*] Target Direct Host: {masked_netloc}")
    print(f"[*] Connecting Role:    {user_part}")
    print(f"[*] Driver:             asyncpg (Direct Unpooled Connection)")
    print(f"[*] Super-Admin Target: {admin_email}")
    print("-----------------------------------------------------------------")

    engine = create_async_engine(
        db_url,
        echo=False,
        future=True,
        connect_args={"timeout": 10, "command_timeout": 15},
    )

    try:
        async with engine.begin() as conn:
            print("[*] Executing DDL Schema Statements...")

            for idx, stmt in enumerate(SCHEMA_STATEMENTS, 1):
                clean_stmt = stmt.strip()
                first_line = clean_stmt.splitlines()[0]
                await conn.execute(text(clean_stmt))
                print(f"  [+] ({idx}/{len(SCHEMA_STATEMENTS)}) {first_line}")

            # Grant table permissions to aqvonx_app if role exists
            try:
                await conn.execute(text("GRANT ALL ON ALL TABLES IN SCHEMA public TO aqvonx_app;"))
                await conn.execute(text("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO aqvonx_app;"))
            except Exception:
                pass

            print("[*] Schema successfully verified & synchronized.")
            print("-----------------------------------------------------------------")

            # First-Time Super-Admin Seeding
            print(f"[*] Seeding super-admin account: {admin_email}...")

            seed_admin_sql = text("""
                INSERT INTO auth_users (email, full_name, role, is_active, is_banned)
                VALUES (:email, :full_name, 'admin', TRUE, FALSE)
                ON CONFLICT (email) DO UPDATE
                SET role = 'admin', is_banned = FALSE, is_active = TRUE
                RETURNING id, email, role, created_at;
            """)

            res = await conn.execute(
                seed_admin_sql,
                {"email": admin_email.strip().lower(), "full_name": admin_name},
            )
            admin_row = res.mappings().first()

            if not admin_row:
                raise RuntimeError("Failed to retrieve admin user record.")

            admin_id = admin_row["id"]
            print(f"  [+] Super-admin verified: ID={admin_id} | Role={admin_row['role']}")

            # Seed NotesGPT Unlimited 10-Year Pro Plan for Admin
            seed_notesgpt_sql = text("""
                INSERT INTO notesgpt_users (user_id, plan_tier, plan_expires_at)
                VALUES (:user_id, 'pro_quarterly', NOW() + INTERVAL '10 years')
                ON CONFLICT (user_id) DO UPDATE
                SET plan_tier = 'pro_quarterly', plan_expires_at = NOW() + INTERVAL '10 years'
                RETURNING id, user_id, plan_tier, plan_expires_at;
            """)

            res_notes = await conn.execute(seed_notesgpt_sql, {"user_id": admin_id})
            notes_row = res_notes.mappings().first()

            print(
                f"  [+] NotesGPT Pro assigned: Tier={notes_row['plan_tier']} | Expires={notes_row['plan_expires_at']}"
            )

        # Verification check
        async with engine.connect() as conn:
            table_check_sql = text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN ('auth_users', 'notesgpt_users', 'notesgpt_usage', 'notesgpt_subscriptions')
                ORDER BY table_name;
            """)
            tables_res = await conn.execute(table_check_sql)
            verified_tables = [r[0] for r in tables_res.fetchall()]

            print("-----------------------------------------------------------------")
            print(f"[SUCCESS] All target tables confirmed in Neon: {verified_tables}")
            print(f"[SUCCESS] Super-admin ({admin_email}) successfully initialized.")
            print("=================================================================")

    except Exception as e:
        error_str = str(e)
        if "permission denied for schema public" in error_str:
            print(f"\n[ERROR] Migration failed: permission denied for schema public", file=sys.stderr)
            print("\n" + "=" * 65, file=sys.stderr)
            print(" NEON PERMISSION RESOLUTION REQUIRED", file=sys.stderr)
            print("=" * 65, file=sys.stderr)
            print("In PostgreSQL 15+, non-owner roles (like aqvonx_migrator) do not", file=sys.stderr)
            print("have CREATE privileges on schema 'public' by default.\n", file=sys.stderr)
            print("To resolve this, choose ONE of the following options:\n", file=sys.stderr)
            print("1. Option A (Recommended): In Neon Console -> SQL Editor, run:", file=sys.stderr)
            print("   GRANT ALL ON SCHEMA public TO aqvonx_migrator, aqvonx_app;\n", file=sys.stderr)
            print("2. Option B: In backend/.env, set DATABASE_URL_UNPOOLED to your", file=sys.stderr)
            print("   'neondb_owner' connection string from the Neon Console dashboard.", file=sys.stderr)
            print("=" * 65 + "\n", file=sys.stderr)
        else:
            print(f"\n[ERROR] Migration failed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        await engine.dispose()


def main():
    parser = argparse.ArgumentParser(
        description="AQVONX Database Migration & Super-Admin Seeder"
    )
    parser.add_argument(
        "--admin-email",
        type=str,
        default="developer@aqvonx.com",
        help="Super-admin email to seed (defaults to developer@aqvonx.com)",
    )
    parser.add_argument(
        "--admin-name",
        type=str,
        default="Super Admin",
        help="Display name for the super-admin account",
    )

    args = parser.parse_args()
    asyncio.run(run_migrations(admin_email=args.admin_email, admin_name=args.admin_name))


if __name__ == "__main__":
    main()
