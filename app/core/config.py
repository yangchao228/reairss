from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_PREFIX: str = "/api/v1"
    DB_PATH: str = "./data/app.db"
    APP_NAME: str = "RSS AI Reader"

    class Config:
        env_prefix = "APP_"


settings = Settings()
