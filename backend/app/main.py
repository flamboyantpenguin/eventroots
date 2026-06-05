from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, category, events, health, think, users, vendor

app = FastAPI(
    title="EventRoots API",
    description="Backend for EventRoots MVP (auth, admin, dashboard, editor chat).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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
