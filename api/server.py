from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import receipts, auth
from config import logger


app = FastAPI(title="Grocery Receipt Parser")
app.add_middleware(
    CORSMiddleware,
    # Allow your Vite frontend to talk to this API
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"], # Allows all headers
)

app.include_router(receipts.router)
app.include_router(auth.router)

@app.get("/")
def health_check():
    """Simple endpoint to verify server is running"""
    logger.info("Health check pinged!")
    return {"status": "online", "message": "Receipt parser API is running"}

