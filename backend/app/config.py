from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "EventRoots"
    PROJECT_VERSION: str = "0.0.1"
    PROJECT_DESC: str = "Backend for EventRoots"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/eventroots"
    REDIS_URL: str | None = None
    DEBUG_SEED_DATA: bool = False
    GEMINI_API_KEY: str | None = None
    UPLOADS_DIR: str = "static/uploads"
    PFP_MAX_SIZE: int = 20 * 1024 * 1024
    SESSION_TOKEN_EXPIRY_HOURS: int = 1
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
