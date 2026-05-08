from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Nexus AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # OpenAI (optional — leave blank to use demo mode)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"

    # Demo mode — fully functional without any API keys
    DEMO_MODE: bool = True  # auto-set to False when OPENAI_API_KEY is provided

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexus.db"
    DB_FILE: str = "./nexus.db"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    CHROMA_COLLECTION: str = "meeting_memory"

    # Embedding model (local, no API key required)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Transcription
    WHISPER_MODEL: str = "small"  # tiny | base | small | medium | large
    USE_WHISPER: bool = False     # True = server-side Faster-Whisper

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def model_post_init(self, __context):
        # Auto-disable demo mode if API key is provided
        if self.OPENAI_API_KEY:
            object.__setattr__(self, "DEMO_MODE", False)


settings = Settings()
