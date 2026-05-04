import os
import json
from dotenv import load_dotenv
from PIL import Image


class ReceiptReader():
    
    @staticmethod
    def get_receipt_data(genai, image_file_object):
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        receipt_image = Image.open(image_file_object)
        
        receipt_image.thumbnail((1600, 1600))

        prompt = """
        You are an expert data parser and mathematician. I am providing you with an image of a Hungarian grocery receipt. 
    Your task is to accurately extract the purchase data, perform necessary unit conversions, and return it STRICTLY as a JSON object.

    Follow these strict extraction and math rules:
    1. Store Name: Extract the name of the store.
    2. Receipt Metadata: Extract the total amount. For payment method, strictly use "CARD" or "CASH". If unknown, use null.
    3. Item Parsing & Standardization (CRITICAL MATH REQUIRED): Read every single item.
       - `receipt_name`: The exact text printed on the receipt (remove tax codes like C00, B00).
       - `name`: Your best guess at the actual product name in plain language Hungarian (e.g., "Alma", "Tej").
       - `size_type`: STRICTLY use one of these four exact strings: "none", "volume", "weight", "pcs".
       
       - `size`: MUST be standardized to Liters or Kilograms! 
         - If weight (g, dkg, kg): Convert to Kilograms (kg) as a decimal (e.g., "500g" -> 0.5, "15dkg" -> 0.15, "2kg" -> 2.0).
         - If volume (ml, cl, dl, L): Convert to Liters (L) as a decimal (e.g., "330ml" -> 0.33, "5dl" -> 0.5, "1.5L" -> 1.5).
         - Use null if no size is indicated.

       - `quantity` & Multipacks (e.g., "3x28g" or "6x1.5L"):
         - If the item text implies a multipack, set `quantity` to the multiplier (e.g., for "3x28g", quantity is 3).
         - For multipacks, the `size` must be the standardized size of ONE unit (e.g., for "3x28g", size is 0.028).
         - If it is not a multipack, use the stated quantity (default to 1).

       - `price_paid`: The final price paid for ONE unit.
         - If the item is a multipack and the receipt shows the total pack price, you MUST divide that total price by the `quantity` to calculate the `price_paid` for a single unit. 
         - (e.g., If "3x28g" costs 300 Ft total, `quantity` is 3, and `price_paid` is 100).

    Output EXACTLY this JSON structure:
    {
      "store": {
        "name": "string"
      },
      "receipt": {
        "total_amount": number,
        "payment_method": "string" 
      },
      "items": [
        {
          "receipt_name": "string",
          "name": "string",
          "size": number,
          "size_type": "string",
          "quantity": number,
          "price_paid": number
        }
      ]
    }
    """
        response = model.generate_content(
            [prompt, receipt_image],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.0 
            )
        )
        
        try:
            final_data = json.loads(response.text)
            
            return final_data

        except json.JSONDecodeError:
            raise Exception(f"Parsing failed with response: {response.text}")