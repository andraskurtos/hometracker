import os
import json
from dotenv import load_dotenv
from PIL import Image


class ReceiptReader():
    
    @staticmethod
    def get_receipt_data(genai, image_file_object):
        model = genai.GenerativeModel('gemini-2.5-flash')
        receipt_image = Image.open(image_file_object)

        prompt = """
        You are an expert data parser. I am providing you with an image of a Hungarian grocery receipt. 
        Your task is to accurately extract the purchase data and return it STRICTLY as a JSON object.

        Follow these strict extraction rules:
        1. READ COMPLETELY: Read every single item from top to bottom. Do not skip lines.
        2. Strip Tax Codes: Remove the 3-letter tax codes (e.g., "C00", "B00", "E00") from the beginning of item names.
        3. Naming Convention:
        - `raw_printed_name`: The exact text printed on the receipt (minus the tax code).
        - `suspected_full_name`: Your best guess at the full, actual product name in plain language.
        - `main_ingredient`: The fundamental base ingredient translated to English (e.g., "Tuna", "Rice"). If non-food, use a generic category (e.g., "Toilet Paper").
        - `icon`: A single relevant emoji representing the main_ingredient (e.g., 🧅, 🥫, 🧻, 🔋).
        4. Metadata: Extract the store name, the grand total (usually next to "ÖSSZESEN"), and the payment method.

        Output EXACTLY this JSON structure:
        {
        "receipt_metadata": {
            "store_name": "string",
            "total_receipt_amount": number,
            "currency": "Ft",
            "payment_method": "string"
        },
        "items": [
            {
            "raw_printed_name": "string",
            "suspected_full_name": "string",
            "main_ingredient": "string",
            "icon": "string",
            "quantity": number,
            "price_per_unit": number,
            "total_item_price": number
            }
        ]
        }
        """

        response = model.generate_content(
            [prompt, receipt_image],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json", # Forces strict JSON output!
                temperature=0.0 # Maximum logic, zero creativity
            )
        )
        
        try:
            # It's guaranteed to be JSON, so we can load it directly
            final_data = json.loads(response.text)
            
            return final_data

        except json.JSONDecodeError:
            raise Exception(f"Parsing failed with response: {response.text}")