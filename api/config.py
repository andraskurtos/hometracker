import os
import logging
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%min:%S"
)
logger = logging.getLogger("receipt_api")

load_dotenv()

DB_CONFIG = {
    "dbname": os.environ["DB_NAME"],
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "host": "127.0.0.1",
    "port": "5432"
}

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

SECRET_KEY = os.environ.get("JWT_KEY")
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60*24*7

