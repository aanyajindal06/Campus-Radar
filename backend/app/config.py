import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

class Settings:
    PROJECT_NAME: str = "CampusRadar - Smart Lost & Found"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production" if os.getenv("RENDER") else "development").lower()
    SEED_DEMO_DATA: bool = os.getenv("SEED_DEMO_DATA", "true").lower() == "true"
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "5"))
    MAX_IMAGES_PER_ITEM: int = int(os.getenv("MAX_IMAGES_PER_ITEM", "5"))
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campusfind-super-secret-jwt-key-2026")
    if ENVIRONMENT == "production" and (not SECRET_KEY or SECRET_KEY in ("campusfind-super-secret-jwt-key-2026", "change-me-to-a-long-random-string", "replace-with-a-long-random-secret")):
        raise RuntimeError("Set a unique SECRET_KEY in the backend environment variables.")
    CORS_ORIGINS: list[str] = [
        origin.strip().rstrip("/")
        for origin in (os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000") + "," + os.getenv("FRONTEND_URL", "")).split(",")
        if origin.strip()
    ]
    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL") or "sqlite:///./campusfind.db"
    
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    if ENVIRONMENT == "production" and DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("Set DATABASE_URL to your Render PostgreSQL connection URL for persistent storage.")

    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
    QR_DIR: str = os.getenv("QR_DIR", os.path.join(BASE_DIR, "qrcodes"))
    
    POINTS_REPORT_FOUND: int = 10
    POINTS_RETURN_ITEM: int = 50
    POINTS_VERIFY_MATCH: int = 10
    POINTS_REPORT_DUPLICATE: int = 5
    
    WEIGHT_IMAGE: float = 0.40
    WEIGHT_DESCRIPTION: float = 0.25
    WEIGHT_ATTRIBUTES: float = 0.15
    WEIGHT_LOCATION: float = 0.10
    WEIGHT_DATE: float = 0.10

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.QR_DIR, exist_ok=True)
