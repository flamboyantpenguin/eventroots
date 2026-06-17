from contextlib import asynccontextmanager
from os import makedirs
from shutil import copytree

import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from redis import asyncio as aioredis
from google import genai

from app.api import auth, category, events, health, think, users, vendor
from app.config import settings
from app.jobs.scheduler import init_scheduler, scheduler
from app.store import db
from app.utils.response import register_error_handlers

DB_URL = settings.DATABASE_URL
REDIS_URL = settings.REDIS_URL
GEMINI_API_KEY = settings.GEMINI_API_KEY


@asynccontextmanager
async def lifespan(_: FastAPI):
    print("Initializing DB...")
    if REDIS_URL is not None:
        print("Redis is set, sessions will be stored in Redis")
        db.redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)

    if not DB_URL:
        print("DB configuration context missing from environment variables.")
        exit(2)
    db.pg_pool = await asyncpg.create_pool(dsn=DB_URL, min_size=10, max_size=20)

    print("Initializing Think...")
    if GEMINI_API_KEY is None:
        print("GEMINI_API_KEY_NOT_SET")
        exit(4)
    think.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    print("Initializing schedulers...")
    init_scheduler()

    print("Preparing Static Dir")
    makedirs(settings.UPLOADS_DIR, exist_ok=True)
    try:
        copytree("static/uploads/templates", settings.UPLOADS_DIR + "/templates", dirs_exist_ok=True)
    except Exception as _:
        print(f"Skipped identical files")
    makedirs(settings.UPLOADS_DIR + "/pfp", exist_ok=True)
    makedirs(settings.UPLOADS_DIR + "/banners", exist_ok=True)

    yield

    print("Closing db connections...")
    await db.pg_pool.close()
    if db.redis_client:
        await db.redis_client.close()

    print("Stopping background scheduler...")
    scheduler.shutdown()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESC,
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
)

cors_origins_str = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip() for origin in cors_origins_str.split(",") if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    settings.API_PREFIX + "/static", StaticFiles(directory="static"), name="static"
)

register_error_handlers(app)

app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(auth.public, prefix=settings.API_PREFIX)
app.include_router(auth.admin, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(vendor.router, prefix=settings.API_PREFIX)
app.include_router(events.router, prefix=settings.API_PREFIX)
app.include_router(think.router, prefix=settings.API_PREFIX)
app.include_router(category.router, prefix=settings.API_PREFIX)
