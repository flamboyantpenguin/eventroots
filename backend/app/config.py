class Settings:
    PROJECT_NAME: str = "EventRoots"
    PROJECT_VERSION: str = "0.0.1"
    PROJECT_DESC: str = "Backend for EventRoots"
    DEFAULT_CORS: str = "http://localhost:5173,http://127.0.0.1"
    API_PREFIX: str = "/api"
    UPLOAD_PFP: str = "static/uploads/pfp"
    ACCESS_PFP: str = "/" + UPLOAD_PFP
    PFP_MAX_SIZE: int = 20 * 1024 * 1024


settings = Settings()
