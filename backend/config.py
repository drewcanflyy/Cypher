import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

class Settings(BaseModel):
    PROJECT_NAME: str = "CYPHER AI"
    VERSION: str = "1.0.0"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    COLAB_BACKEND_URL: str = os.getenv("COLAB_BACKEND_URL", "")
    DEFAULT_LLM_MODEL: str = os.getenv("DEFAULT_LLM_MODEL", "llama-3.3-70b-versatile")
    DEFAULT_TTS_VOICE: str = os.getenv("DEFAULT_TTS_VOICE", "en-US-GuyNeural")

settings = Settings()
