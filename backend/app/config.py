from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # Email settings (even if mocked, good to have structurally)
    MAIL_USERNAME: str = "mock@example.com"
    MAIL_PASSWORD: str = "mock"
    MAIL_FROM: str = "no-reply@cryptobeacon.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"

    # External APIs
    NEWSDATA_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    COINGECKO_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
