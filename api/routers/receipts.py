from fastapi import APIRouter, UploadFile, File, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_CONFIG, logger, genai
from receipt_reader import ReceiptReader as reader

router = APIRouter(
    prefix="/api/receipts",
    tags=["Receipts"]
)

@router.post("/parse")
async def parse_receipt_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    conn = None
    cur = None
    try:
        logger.info("Sending request")
        # 1. Get the JSON from Gemini
        parsed_data = reader.get_receipt_data(genai, file.file)
        logger.info("request processed")
        # 2. Connect to the database
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        # --- DATABASE INSERTION PIPELINE ---
        
        # Step A: UPSERT STORE
        # If the store exists, DO UPDATE just sets the name to itself so we can use RETURNING id.
        cur.execute("""
            INSERT INTO stores (name) 
            VALUES (%s)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        """, (parsed_data["store"]["name"],))
        store_id = cur.fetchone()[0]

        # Step B: INSERT RECEIPT
        cur.execute("""
            INSERT INTO receipts (store_id, total, payment_method)
            VALUES (%s, %s, %s)
            RETURNING id;
        """, (
            store_id, 
            parsed_data["receipt"]["total_amount"], 
            parsed_data["receipt"]["payment_method"]
        ))
        receipt_id = cur.fetchone()[0]

        # Step C: UPSERT ITEMS & INSERT RECEIPT_ITEMS (The Merge Table)
        for item in parsed_data["items"]:
            
            # 1. Upsert the Item into the Catalog
            # If the receipt_name already exists, we keep the existing catalog name
            # but we still return the ID so we can link it.
            cur.execute("""
                INSERT INTO items (receipt_name, name, size, size_type)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (receipt_name) DO UPDATE 
                SET receipt_name = EXCLUDED.receipt_name
                RETURNING id;
            """, (
                item["receipt_name"], 
                item["name"], 
                item.get("size"), 
                item["size_type"]
            ))
            item_id = cur.fetchone()[0]

            # 2. Insert the specific transaction into the Merge Table
            cur.execute("""
                INSERT INTO receipt_items (receipt_id, item_id, quantity, price_paid)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (receipt_id, item_id) DO UPDATE SET
                    quantity = receipt_items.quantity + EXCLUDED.quantity,
                    price_paid = receipt_items.price_paid + EXCLUDED.price_paid;
            """, (receipt_id, item_id, item["quantity"], item["price_paid"]))
            
        # --- END PIPELINE ---
        
        # Commit the transaction to save to disk
        conn.commit()
        cur.close()
        
        return {
            "status": "success",
            "message": f"Saved receipt {receipt_id} from store ID {store_id} with {len(parsed_data['items'])} items.",
            "data": parsed_data
        }

    except Exception as e:
        # If ANYTHING fails (Gemini parsing, DB constraints, missing data), 
        # rollback the entire transaction so we don't get partial data in the DB.
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()
            
@router.get("/")
def get_all_receipts():
    """
    Retrieves all receipts from the database, perfectly formatted as JSON, 
    including the store details and all individual items.
    """
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        # RealDictCursor makes the rows behave like JSON objects!
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Fetch all receipts and join the Store name
        cur.execute("""
            SELECT 
                r.id as receipt_id, 
                r.total as total_amount, 
                r.payment_method, 
                r.created_at,
                s.name as store_name
            FROM receipts r
            JOIN stores s ON r.store_id = s.id
            ORDER BY r.created_at DESC;
        """)
        receipts_data = cur.fetchall()
        
        # 2. Fetch ALL items for ALL receipts
        cur.execute("""
            SELECT 
                ri.receipt_id,
                i.receipt_name,
                i.name,
                i.size,
                i.size_type,
                ri.quantity,
                ri.price_paid
            FROM receipt_items ri
            JOIN items i ON ri.item_id = i.id;
        """)
        all_items = cur.fetchall()
        
        # 3. Assemble the JSON payload (Stitch items to their receipts)
        # We create a dictionary to group items by their receipt_id
        items_by_receipt = {}
        for item in all_items:
            r_id = item["receipt_id"]
            if r_id not in items_by_receipt:
                items_by_receipt[r_id] = []
            
            # Remove the receipt_id from the item dict before sending to frontend
            item_data = dict(item)
            del item_data["receipt_id"]
            items_by_receipt[r_id].append(item_data)
        
        # 4. Format the final output list
        final_output = []
        for receipt in receipts_data:
            r_id = receipt["receipt_id"]
            
            formatted_receipt = {
                "id": r_id,
                "store": {
                    "name": receipt["store_name"]
                },
                "total_amount": receipt["total_amount"],
                "payment_method": receipt["payment_method"],
                "created_at": receipt["created_at"].isoformat(), # Format dates for JSON
                "items": items_by_receipt.get(r_id, []) # Attach the items array
            }
            final_output.append(formatted_receipt)

        return {
            "status": "success",
            "count": len(final_output),
            "data": final_output
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cur.close()
            conn.close()
