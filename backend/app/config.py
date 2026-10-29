from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FINE_PER_DAY: float = 5.0  # 👈 Make sure this is 5.0
    LOAN_DAYS: int = 14

    class Config:
        env_file = ".env"

settings = Settings()