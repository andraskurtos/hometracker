import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import receipts, auth, users, households
from config import logger


app = FastAPI(title="Grocery Receipt Parser")

# Comma-separated allowlist of browser origins. Defaults to "*".
#
# Auth uses Bearer tokens in the Authorization header — never cookies — so
# allow_credentials stays False. That is also what makes the "*" default legal:
# browsers reject "*" combined with credentials. Behind the nginx reverse proxy
# in docker-compose every request is same-origin, so CORS is not exercised at
# all in the deployed setup; this exists for direct/host-dev access.
_cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "").split(",")
    if origin.strip()
] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],  # Allows all headers
)

app.include_router(receipts.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(households.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def health_check():
    """Simple endpoint to verify server is running"""
    logger.info("Health check pinged!")
    return {"status": "online", "message": "Receipt parser API is running"}
