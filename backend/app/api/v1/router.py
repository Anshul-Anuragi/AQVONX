from fastapi import APIRouter
from app.api.v1.endpoints import auth, license, notes, webhooks, portalsnap

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Handshake"])
api_router.include_router(license.router, prefix="/license", tags=["License & Quotas"])
api_router.include_router(notes.router, prefix="/notes", tags=["Gemini Notes Proxy"])
api_router.include_router(portalsnap.router, prefix="/portalsnap", tags=["PortalSnap PDF Scanner"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Payment Webhooks"])

