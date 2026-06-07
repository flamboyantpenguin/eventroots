from contextlib import asynccontextmanager
from os import getenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, category, events, health, think, users, vendor
from app.config import settings
from app.jobs.scheduler import init_scheduler, scheduler


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_scheduler()

    yield

    print("Stopping background scheduler...")
    scheduler.shutdown()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESC,
    version=settings.PROJECT_VERSION,
)

cors_origins_str = getenv("CORS_ORIGINS", settings.DEFAULT_CORS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip() for origin in cors_origins_str.split(",") if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(vendor.router, prefix=settings.API_PREFIX)
app.include_router(events.router, prefix=settings.API_PREFIX)
app.include_router(think.router, prefix=settings.API_PREFIX)
app.include_router(category.router, prefix=settings.API_PREFIX)
