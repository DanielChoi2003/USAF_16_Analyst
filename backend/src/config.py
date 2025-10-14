"""
Application Configuration — Environment-based Settings

This module loads configuration from environment variables using Pydantic Settings.
All sensitive values (API keys, database URLs) should be stored in .env file.

Author: Ethan Curb
Last Updated: 2025-10-11
"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Default values are provided for development. Override in .env file.
    """
    
    # ── Application Metadata ────────────────────────────────────────────────
    APP_NAME: str = "Analyst Copilot"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"  # DEBUG | INFO | WARNING | ERROR
    
    # ── API Server ──────────────────────────────────────────────────────────
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True  # Auto-reload on code changes (dev only)
    
    # ── CORS ────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # ── Database ────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./analyst_copilot.db"
    
    # ── LLM Provider ────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    
    # Google Gemini (alternative)
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"
    
    # Azure OpenAI (for GovCloud)
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"
    
    # ── Vector Database (ChromaDB) ──────────────────────────────────────────
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    CHROMA_COLLECTION_MITRE: str = "mitre_techniques"
    CHROMA_COLLECTION_MISP: str = "misp_events"
    
    # ── MITRE ATT&CK ────────────────────────────────────────────────────────
    MITRE_TAXII_URL: str = "https://attack-taxii.mitre.org/taxii2/"
    MITRE_DATA_DIR: str = "../../data/mitre"
    
    # ── MISP (Threat Intel) ─────────────────────────────────────────────────
    MISP_ENABLED: bool = False
    MISP_URL: str = ""
    MISP_API_KEY: str = ""
    MISP_VERIFY_SSL: bool = True
    
    # ── Feature Flags ───────────────────────────────────────────────────────
    ENABLE_RAG: bool = True
    ENABLE_PROVENANCE_TRACKING: bool = True
    ENABLE_METRICS: bool = False
    ENABLE_AUTH: bool = False
    
    # ── Caching ─────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 3600
    
    # ── Security ────────────────────────────────────────────────────────────
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        """Pydantic config: load from .env file."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to ensure settings are loaded only once.
    Call this function to access settings throughout the application.
    
    Returns:
        Settings instance with environment variables loaded
    """
    return Settings()


# Global settings instance
settings = get_settings()
