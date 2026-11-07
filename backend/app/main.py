import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
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
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

# CORS configuration supporting verified web clients & chrome extensions
cors_origins = [o for o in settings.ALLOWED_ORIGINS if "*" not in o]
if settings.ALLOWED_EXTENSION_IDS:
    for ext_id in settings.ALLOWED_EXTENSION_IDS:
        cors_origins.append(f"chrome-extension://{ext_id}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^chrome-extension://[a-p]{32}$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Extension-ID", "Accept"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
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
