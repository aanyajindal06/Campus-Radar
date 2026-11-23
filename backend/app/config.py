import os

class Settings:
    PROJECT_NAME: str = "CampusRadar - Smart Lost & Found"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campusfind-super-secret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./campusfind.db")
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    QR_DIR: str = os.path.join(BASE_DIR, "qrcodes")
    
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
