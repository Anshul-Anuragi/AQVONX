import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.db.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aqvonx")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if Neon PostgreSQL is configured
    logger.info("Initializing AQVONX Hub Backend...")
    if settings.is_database_configured:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Neon PostgreSQL schemas verified successfully.")
        except Exception as e:
            logger.warning(f"Database connection attempt failed: {e}")
    else:
        logger.info("Running in development sandbox mode (Neon PostgreSQL DATABASE_URL pending real credentials).")

    yield
    logger.info("AQVONX Backend shutting down.")


app = FastAPI(
    title="AQVONX Intelligence Hub API",
    description="Centralized multi-product licensing, quota management, and Gemini Flash proxy for Chrome extensions (NotesGPT, PortalSnap, EditorialLens).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Sanitize exact origins for CORS (filter out wildcards which are handled by allow_origin_regex)
exact_origins = [o for o in settings.ALLOWED_ORIGINS if "*" not in o]

# CORS configuration supporting web clients & chrome extensions
app.add_middleware(
    CORSMiddleware,
    allow_origins=exact_origins,
    allow_origin_regex=r"(https?://.*|chrome-extension://.*)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "platform": "AQVONX Intelligence Hub",
        "status": "online",
        "api_v1": "/api/v1",
        "docs": "/docs",
        "database_connected": settings.is_database_configured,
        "gemini_live": settings.is_gemini_configured,
        "products_supported": ["notesgpt", "portalsnap", "editoriallens"]
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "aqvonx-backend",
        "database": "configured" if settings.is_database_configured else "pending_credentials",
        "gemini": "live" if settings.is_gemini_configured else "sandbox_mock"
    }
