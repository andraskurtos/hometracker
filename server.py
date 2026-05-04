import os
import json
from receipt_reader import ReceiptReader as reader
from dotenv import load_dotenv
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
import google.generativeai as genai


load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

app = FastAPI(title="Grocery Receipt Parser")


@app.get("/")
def health_check():
    """Simple endpoint to verify server is running"""
    return {"status": "online", "message": "Receipt parser API is running"}

@app.post("/api/parse-receipt")
async def parse_receipt_endpoint(file: UploadFile = File(...)):
    """
    Accepts an image file via POST request, and returns a JSON of the receipt contents via the use of GEMINI.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        parsed_data = reader.get_receipt_data(genai, file.file)
        
        return parsed_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
