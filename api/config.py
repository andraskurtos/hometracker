import os
import logging
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

SECRET_KEY = os.environ.get("JWT_KEY")
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60*24*7
MODEL_NAME = os.environ.get("LLM_MODEL")

UPLOAD_DIR = os.environ.get("UPLOAD_DIR")
os.makedirs(UPLOAD_DIR, exist_ok=True)

