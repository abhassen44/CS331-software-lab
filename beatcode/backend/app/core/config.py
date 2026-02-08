from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "Intelligent Coding Agent"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/auth_module"  # .env: DATABASE_URL

    # JWT
    secret_key: str = "your_jwt_secret_key"  # .env: JWT_SECRET_KEY
    algorithm: str = "HS256"  # .env: JWT_ALGORITHM
    access_token_expire_minutes: int = 30  # .env: ACCESS_TOKEN_EXPIRE_MINUTES
    refresh_token_expire_days: int = 7  # .env: REFRESH_TOKEN_EXPIRE_DAYS

    # Gemini AI
    gemini_api_key: str = ""  # .env: GEMINI_API_KEY

    # Vector DB
    qdrant_host: str = "localhost"  # .env: QDRANT_HOST
    qdrant_port: int = 6333  # .env: QDRANT_PORT
    qdrant_collection: str = "ica_code_chunks"  # .env: QDRANT_COLLECTION

    # File Storage
    file_storage_path: str = "./storage/files"  # .env: FILE_STORAGE_PATH

    # Redis
    redis_url: str = "redis://localhost:6379"  # .env: REDIS_URL

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
