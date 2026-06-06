from os import getenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, category, events, health, think, users, vendor
from app.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for EventRoots MVP (auth, admin, dashboard, editor chat).",
    version=settings.PROJECT_VERSION,
)

cors_origins_str = getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip() for origin in cors_origins_str.split(",") if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"

app.include_router(health.router, prefix=API_PREFIX)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(vendor.router, prefix=API_PREFIX)
app.include_router(events.router, prefix=API_PREFIX)
app.include_router(think.router, prefix=API_PREFIX)
app.include_router(category.router, prefix=API_PREFIX)
