import os
import urllib.parse
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AQVONX Hub Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database: Neon PostgreSQL asyncpg connection string
    # e.g. postgresql+asyncpg://user:pass@ep-cool-sample.us-east-2.aws.neon.tech/neondb?ssl=require
    DATABASE_URL: str = "postgresql+asyncpg://neondb_owner:YOUR_NEON_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?ssl=require"

    # AI Service Keys
    GEMINI_API_KEY: str = "AIzaSy_YOUR_REAL_GEMINI_API_KEY_HERE"

    # Security & JWT
    JWT_SECRET_KEY: str = "supersecret_aqvonx_jwt_signing_key_change_in_production_123456789"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours (short-lived access tokens)
    ADMIN_EMAILS: List[str] = ["developer@aqvonx.com"]

    # Payment Gateways (Razorpay & LemonSqueezy)
    RAZORPAY_KEY_ID: str = "rzp_test_xxxx"
    RAZORPAY_KEY_SECRET: str = "rzp_secret_xxxx"
    RAZORPAY_WEBHOOK_SECRET: str = "whsec_xxxx"

    LEMONSQUEEZY_API_KEY: str = "lmsq_xxxx"
    LEMONSQUEEZY_WEBHOOK_SECRET: str = "lmsq_whsec_xxxx"

    # CORS Whitelist (Explicit origins only - never wildcard with credentials)
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://aqvonx.com",
        "https://www.aqvonx.com",
    ]
    ALLOWED_EXTENSION_IDS: List[str] = []

    # Quota Limits
    FREE_TIER_DAILY_LIMIT: int = 5
    PRO_TIER_DAILY_LIMIT: int = 250

    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def is_database_configured(self) -> bool:
        """Checks if real Neon database credentials have been configured."""
        placeholders = ["YOUR_NEON_PASSWORD", "ep-sample", "ep-xyz", "password_here", "npg_password"]
        return not any(p in self.DATABASE_URL for p in placeholders)

    @property
    def is_gemini_configured(self) -> bool:
        """Checks if a valid Google Gemini API key has been provided."""
        placeholders = ["YOUR_REAL_GEMINI_API_KEY", "YOUR_GEMINI_API_KEY", "AIzaSy_YOUR", "xxxx"]
        return bool(self.GEMINI_API_KEY) and not any(p in self.GEMINI_API_KEY for p in placeholders)

    @property
    def async_database_url(self) -> str:
        """
        Converts standard Neon URL to asyncpg format and cleans up incompatible query parameters.
        Neon dashboards provide: postgresql://.../neondb?sslmode=require
        Asyncpg requires: postgresql+asyncpg://.../neondb?ssl=require
        """
        # Prefer direct unpooled connection for asyncpg driver stability
        raw_url = os.getenv("DATABASE_URL_UNPOOLED") or self.DATABASE_URL
        url = raw_url.strip()

        # Direct compute connection is vastly more reliable for asyncpg than PgBouncer
        if "-pooler." in url:
            url = url.replace("-pooler.", ".")
        
        # 1. Scheme conversion
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]

        try:
            parsed = urllib.parse.urlsplit(url)
            query_params = urllib.parse.parse_qs(parsed.query)

            # Convert sslmode to ssl for asyncpg
            if "sslmode" in query_params:
                ssl_val = query_params.pop("sslmode")[0]
                if ssl_val in ["require", "verify-ca", "verify-full"]:
                    query_params["ssl"] = ["require"]

            # Remove unsupported asyncpg URL params
            for unsupported in ["channel_binding", "target_session_attrs", "gssencmode", "application_name"]:
                query_params.pop(unsupported, None)

            new_query = urllib.parse.urlencode(query_params, doseq=True)
            return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment))
        except Exception:
            return url


settings = Settings()
