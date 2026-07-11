import os
from dotenv import load_dotenv


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()


# ==========================================
# CONFIGURATION
# ==========================================

class Config:

    # Flask Secret Key
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "ai-chatbot-secret-key"
    )

    # OpenRouter API Key
    OPENROUTER_API_KEY = os.getenv(
        "OPENROUTER_API_KEY"
    )

    # OpenRouter Base URL
    OPENROUTER_BASE_URL = (
        "https://openrouter.ai/api/v1"
    )

    # AI Model
    AI_MODEL = os.getenv(
        "AI_MODEL",
        "openrouter/free"
    )

    # Database
    DATABASE = os.getenv(
        "DATABASE",
        "chatbot.db"
    )

    # Flask Settings
    DEBUG = True
    TESTING = False
    JSON_SORT_KEYS = False
    TEMPLATES_AUTO_RELOAD = True

    # Maximum Request Size
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024


# ==========================================
# VALIDATE CONFIG
# ==========================================

if not Config.OPENROUTER_API_KEY:

    raise ValueError(
        "OPENROUTER_API_KEY not found. "
        "Please add OPENROUTER_API_KEY "
        "to your .env file."
    )