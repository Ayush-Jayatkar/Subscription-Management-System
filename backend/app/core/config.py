from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Brightloop Subscription Management System"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    frontend_url: str = "http://localhost:5173"
    database_url: str = "postgresql+psycopg2://brightloop:brightloop_dev@localhost:5432/brightloop"
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    model_config = SettingsConfigDict(
    env_file=BACKEND_DIR / ".env",
    env_file_encoding="utf-8",
    extra="ignore"
)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
