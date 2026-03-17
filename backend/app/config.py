from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_USE_DIRECT_DB: bool = os.getenv("SUPABASE_USE_DIRECT_DB", "false").lower() == "true"
    SUPABASE_DIRECT_DB_URL: str = os.getenv("SUPABASE_DIRECT_DB_URL", "")
    NEWSAPI_KEY: str = os.getenv("NEWSAPI_KEY", "")
    GOOGLE_AI_STUDIO_API_KEY: str = os.getenv("GOOGLE_AI_STUDIO_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.0-mini")
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    OPENPHISH_FEED_URL: str = os.getenv("OPENPHISH_FEED_URL", "")
    REDDIT_USER_AGENT: str = os.getenv("REDDIT_USER_AGENT", "")
    TEST_DB_API_TOKEN: str = os.getenv("TEST_DB_API_TOKEN", "")
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    RATE_LIMIT_VERIFY_PER_WINDOW: int = int(os.getenv("RATE_LIMIT_VERIFY_PER_WINDOW", "30"))
    RATE_LIMIT_ANALYSIS_PER_WINDOW: int = int(os.getenv("RATE_LIMIT_ANALYSIS_PER_WINDOW", "45"))
    RATE_LIMIT_DASHBOARD_PER_WINDOW: int = int(os.getenv("RATE_LIMIT_DASHBOARD_PER_WINDOW", "180"))
    RATE_LIMIT_HISTORY_PER_WINDOW: int = int(os.getenv("RATE_LIMIT_HISTORY_PER_WINDOW", "180"))
    RATE_LIMIT_TRENDING_PER_WINDOW: int = int(os.getenv("RATE_LIMIT_TRENDING_PER_WINDOW", "60"))
    RATE_LIMIT_TEST_DB_PER_WINDOW: int = int(os.getenv("RATE_LIMIT_TEST_DB_PER_WINDOW", "15"))
    CREDIBILITY_TOP_ARTICLES_CONSIDERED: int = int(os.getenv("CREDIBILITY_TOP_ARTICLES_CONSIDERED", "5"))
    CREDIBILITY_RELEVANCE_MIN: int = int(os.getenv("CREDIBILITY_RELEVANCE_MIN", "45"))
    CREDIBILITY_WEIGHT_MEAN_QUALITY: float = float(os.getenv("CREDIBILITY_WEIGHT_MEAN_QUALITY", "0.60"))
    CREDIBILITY_WEIGHT_TRUST_RATIO: float = float(os.getenv("CREDIBILITY_WEIGHT_TRUST_RATIO", "0.20"))
    CREDIBILITY_WEIGHT_SUPPORT_RATIO: float = float(os.getenv("CREDIBILITY_WEIGHT_SUPPORT_RATIO", "0.20"))
    CREDIBILITY_CONTRADICTION_PENALTY: float = float(os.getenv("CREDIBILITY_CONTRADICTION_PENALTY", "25"))
    CREDIBILITY_TRUE_THRESHOLD: int = int(os.getenv("CREDIBILITY_TRUE_THRESHOLD", "75"))
    CREDIBILITY_UNVERIFIED_THRESHOLD: int = int(os.getenv("CREDIBILITY_UNVERIFIED_THRESHOLD", "45"))
    BACKEND_CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()


def validate_required_settings() -> None:
    missing: list[str] = []

    if not settings.SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not settings.SUPABASE_KEY:
        missing.append("SUPABASE_KEY")

    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
