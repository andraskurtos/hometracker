from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
from routers.auth import get_current_user_id
from config import DB_CONFIG, logger
from receipt_reader import ReceiptReader as reader

router = APIRouter(
    prefix="/api/receipts",
    tags=["Receipts"]
)

@router.post("/parse")
async def parse_receipt(
                        household_id: str,
                        file: UploadFile = File(...),
                        user_id: str=Depends(get_current_user_id)
                        ):
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    conn = None
    cur = None
    try:
        logger.info(f"Processing receipt for household {household_id} by user {user_id}")
        # 1. Get the JSON from Gemini
        parsed_data = reader.get_receipt_data(file.file)
        logger.info("request processed")
        # 2. Connect to the database
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        # --- DATABASE INSERTION PIPELINE ---
        
        cur.execute("SELECT 1 FROM household_members WHERE household_id = %s AND user_id = %s", (household_id, user_id))
        if not cur.fetchone():
            raise HTTPException(status_code=403, detail="You are not a member of this household")  
        
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
            INSERT INTO receipts (store_id, total, payment_method, household_id)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
        """, (
            store_id, 
            parsed_data["receipt"]["total_amount"], 
            parsed_data["receipt"]["payment_method"],
            household_id
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
                RETURNING id;
            """, (receipt_id, item_id, item["quantity"], item["price_paid"]))
            
            receipt_item_id = cur.fetchone()[0]
            cur.execute("""
                            INSERT INTO item_owners (receipt_item_id, user_id, percentage)
                            VALUES (%s, %s, 100.00);
                        """, (receipt_item_id, user_id))
            
        # --- END PIPELINE ---
        
        # Commit the transaction to save to disk
        conn.commit()
        cur.close()
        
        return {
            "status": "success",
            "message": f"Saved receipt {receipt_id} to household {household_id}",
            "data": parsed_data
        }

    except Exception as e:
        if conn:
            conn.rollback()
            logger.error(f"Error parsing receipt: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            if cur: cur.close()
            if conn: conn.close()
            
@router.get("/{household_id}")
def get_household_receipts(household_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Retrieves all receipts for a specific household, including items and ownership shares.
    """
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Verify membership
        cur.execute("SELECT 1 FROM household_members WHERE household_id = %s AND user_id = %s", (household_id, user_id))
        if not cur.fetchone():
            raise HTTPException(status_code=403, detail="You are not a member of this household")

        # 1. Fetch all receipts for the household
        cur.execute("""
            SELECT 
                r.id as receipt_id, 
                r.total as total_amount, 
                r.payment_method, 
                r.created_at,
                s.name as store_name
            FROM receipts r
            JOIN stores s ON r.store_id = s.id
            WHERE r.household_id = %s
            ORDER BY r.created_at DESC;
        """, (household_id,))
        receipts_data = cur.fetchall()
        
        # 2. Fetch items and their owners for the household's receipts
        cur.execute("""
            SELECT 
                ri.receipt_id,
                ri.id,
                i.receipt_name,
                i.name,
                i.size,
                i.size_type,
                ri.quantity,
                ri.price_paid,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', io.user_id,
                            'percentage', io.percentage
                        )
                    ) FILTER (WHERE io.id IS NOT NULL),
                    '[]'
                ) as owners
            FROM receipt_items ri
            JOIN items i ON ri.item_id = i.id
            JOIN receipts r ON ri.receipt_id = r.id
            LEFT JOIN item_owners io ON ri.id = io.receipt_item_id
            WHERE r.household_id = %s
            GROUP BY ri.id, i.id;
        """, (household_id,))
        all_items = cur.fetchall()
        
        items_by_receipt = {}
        for item in all_items:
            r_id = item["receipt_id"]
            if r_id not in items_by_receipt:
                items_by_receipt[r_id] = []
            
            item_data = dict(item)
            del item_data["receipt_id"]
            items_by_receipt[r_id].append(item_data)
        
        final_output = []
        for receipt in receipts_data:
            r_id = receipt["receipt_id"]
            final_output.append({
                "id": r_id,
                "store": {"name": receipt["store_name"]},
                "total_amount": receipt["total_amount"],
                "payment_method": receipt["payment_method"],
                "created_at": receipt["created_at"].isoformat(),
                "items": items_by_receipt.get(r_id, [])
            })

        return {
            "status": "success",
            "data": final_output
        }

    except Exception as e:
        logger.error(f"Error fetching receipts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cur.close()
            conn.close()
