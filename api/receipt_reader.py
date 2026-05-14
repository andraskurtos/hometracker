import os
import json
import base64
import io
from PIL import Image
from litellm import completion
from config import MODEL_NAME

class ReceiptReader():
    
    @staticmethod
    def get_receipt_data(image_file_object):
        # 1. Open and resize image using PIL
        receipt_image = Image.open(image_file_object)
        receipt_image.thumbnail((1600, 1600))
        
        # 2. Convert PIL image to base64
        buffered = io.BytesIO()
        receipt_image.save(buffered, format="JPEG")
        base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')

        prompt = """
        You are an expert data parser and mathematician. I am providing you with an image of a Hungarian grocery receipt. 
Your task is to accurately extract the purchase data, perform necessary unit conversions, and return it STRICTLY as a JSON object.

Follow these strict extraction and math rules:

1. **Store Name:** Extract the name of the store.
2. **Receipt Metadata:** Extract the total amount. For payment method, strictly use "CARD" or "CASH". If unknown, use null.
3. **Item Parsing & Standardization:** Read every single item carefully.
   *   `receipt_name`: The exact text printed on the receipt (remove tax codes like C00, B00).
   *   `name`: Your best guess at the actual product name in plain language Hungarian (e.g., "Alma", "Tej").
   *   `size_type`: STRICTLY use one of these four exact strings: "none", "volume", "weight", "pcs".
   *   `size`: MUST be standardized to Liters or Kilograms! 
       *   If weight (g, dkg, kg): Convert to Kilograms (kg) as a decimal (e.g., "500g" -> 0.5, "15dkg" -> 0.15, "2kg" -> 2.0).
       *   If volume (ml, cl, dl, L): Convert to Liters (L) as a decimal (e.g., "330ml" -> 0.33, "5dl" -> 0.5, "1.5L" -> 1.5).
       *   Use null if no size is indicated.
   *   `quantity` & Multipacks:
       *   If the item text implies a multipack (e.g., "3x28g" or "6x1.5L"), set `quantity` to the multiplier (e.g., for "3x28g", quantity is 3).
       *   For multipacks, the `size` must be the standardized size of ONE unit (e.g., for "3x28g", size is 0.028).
       *   If it is not a multipack, use the stated quantity (default to 1).

4. **Item Aggregation (CRITICAL STEP):**
   *   If the exact same item (`name` and `size`) is listed multiple times on the receipt (e.g., two separate entries for the same type of milk), you MUST concatenate them into a single entry in the JSON.
   *   Sum their `quantity` values together.

5. **Handling Discounts & Final Price Math (`price_paid`):**
   *   `price_paid` MUST represent the final, post-discount price paid for ONE single unit of the item.
   *   Receipts often contain negative prices (e.g., Clubcard promotions, coupons) immediately following the target item or at the bottom of the receipt.
   *   **Formula:** (Total Combined Item Cost - Total Associated Discounts) / Total Combined Quantity = `price_paid`.
   *   *Example:* You buy 2 identical items for 1000 Ft total. The receipt shows a -200 Ft discount line below them. The total actual cost is 800 Ft. The final `price_paid` for the JSON is 400.
   *   Items sold by weight can also have an informative per unit price noted on the receipt. (e.g. 0,286 KG * 1199 Ft/KG ...... 343) In this case, ignore the per unit price, and use the immediately following regular number as price (343 in case of example)

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
        
        # 3. Call LiteLLM
        # LiteLLM looks for GEMINI_API_KEY or GOOGLE_API_KEY. 
        # We'll pass it explicitly from the environment to be safe.
        api_key = os.environ.get("GEMINI_API_KEY")

        response = completion(
            model=MODEL_NAME,
            api_key=api_key,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={ "type": "json_object" },
            temperature=0.0
        )
        
        try:
            content = response.choices[0].message.content
            final_data = json.loads(content)
            return final_data

        except (json.JSONDecodeError, AttributeError, IndexError) as e:
            raise Exception(f"Parsing failed: {str(e)}. Response: {response}")
