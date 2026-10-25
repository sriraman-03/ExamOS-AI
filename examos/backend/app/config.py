import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/examos.db")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./data/uploads")
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "20"))
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    LLM_MODEL: str = "claude-sonnet-4-6"

    @property
    def DEMO_MODE(self) -> bool:
        """True when no Anthropic API key is configured.

        In demo mode ExamOS falls back to rule-based / templated logic
        for chat, quiz generation, revision sheets, etc, so the whole
        product is still fully clickable and functional without any
        external API cost.
        """
        return not self.ANTHROPIC_API_KEY


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", "")) or ".", exist_ok=True)
