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
    "host": os.environ.get("DB_HOST", "127.0.0.1"),
    "port": os.environ.get("DB_PORT", "5432"),
}

SECRET_KEY = os.environ.get("JWT_KEY")
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60*24*7
MODEL_NAME = os.environ.get("LLM_MODEL")

UPLOAD_DIR = os.environ.get("UPLOAD_DIR")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Web Push (VAPID) ---
# Generate once with: python -c "from py_vapid import Vapid; v=Vapid(); v.generate_keys(); print(v.private_pem(), v.public_pem())"
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY  = os.environ.get("VAPID_PUBLIC_KEY")
VAPID_SUBJECT     = os.environ.get("VAPID_SUBJECT", "mailto:admin@hometracker.local")

