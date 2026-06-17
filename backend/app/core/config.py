from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    CLERK_SECRET_KEY: str
    CLERK_PUBLISHABLE_KEY: str
    CLERK_WEBHOOK_SECRET: str
    CLERK_AUTHORIZED_PARTIES: list[str] = ["http://localhost:3000"]
    FRONTEND_URL: str
    DEEPGRAM_API_KEY: str
    GROQ_API_KEY: str
    AWS_ACCESS_KEY_ID: str = "test"
    AWS_SECRET_ACCESS_KEY: str = "test"
    AWS_REGION: str = "us-east-1"
    AWS_ENDPOINT_URL: str = "http://localhost:4566"
    AUDIO_BUCKET_NAME: str = "clearnote-audio"

    class Config:
        env_file = ".env"


settings = Settings()