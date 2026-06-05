from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    CLERK_SECRET_KEY: str
    CLERK_PUBLISHABLE_KEY: str
    CLERK_WEBHOOK_SECRET: str
    CLERK_AUTHORIZED_PARTIES: list[str] = ["http://localhost:3000"]
    FRONTEND_URL: str

    class Config:
        env_file = ".env"


settings = Settings()