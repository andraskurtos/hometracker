from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from typing import List
from routers.auth import get_current_user_id
from config import DB_CONFIG, logger
from receipt_reader import ReceiptReader as reader

router = APIRouter(
    prefix="/api/receipts",
    tags=["Receipts"]
)

class OwnerUpdate(BaseModel):
    id: str # user_id
    amount: float

class OwnersUpdate(BaseModel):
    owners: List[OwnerUpdate]

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
            INSERT INTO receipts (store_id, total, payment_method, household_id, payee)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            store_id, 
            parsed_data["receipt"]["total_amount"], 
            parsed_data["receipt"]["payment_method"],
            household_id,
            user_id
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
            
            # Initial owner is the payee with 100% of the amount
            total_item_price = round(item["quantity"] * item["price_paid"], 2)
            cur.execute("""
                            INSERT INTO item_owners (receipt_item_id, user_id, amount)
                            VALUES (%s, %s, %s);
                        """, (receipt_item_id, user_id, total_item_price))
            
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
                r.payee,
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
                            'amount', io.amount,
                            'settled', io.settled
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
            # Convert decimal back to float for JSON
            for o in item_data['owners']:
                o['amount'] = float(o['amount'])
            items_by_receipt[r_id].append(item_data)
        
        final_output = []
        for receipt in receipts_data:
            r_id = receipt["receipt_id"]
            final_output.append({
                "id": r_id,
                "store": {"name": receipt["store_name"]},
                "total_amount": float(receipt["total_amount"]),
                "payment_method": receipt["payment_method"],
                "created_at": receipt["created_at"].isoformat(),
                "payee": receipt["payee"],
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

@router.put("/{receipt_id}/{receipt_item_id}")
def update_item_owners(
    receipt_id: int,
    receipt_item_id: int,
    payload: OwnersUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Updates owners for a specific receipt item.
    URL: /api/receipts/{receipt_id}/{receipt_item_id}
    """
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Verify that the receipt exists and the requester is the payee
        cur.execute("""
            SELECT payee FROM receipts WHERE id = %s;
        """, (receipt_id,))
        
        receipt = cur.fetchone()
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
            
        if receipt['payee'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied: Only the payee can modify splitting")

        # 2. Verify that the receipt_item actually belongs to the receipt and get its total price
        cur.execute("SELECT quantity, price_paid FROM receipt_items WHERE id = %s AND receipt_id = %s", (receipt_item_id, receipt_id))
        ri = cur.fetchone()
        if not ri:
            raise HTTPException(status_code=404, detail="Item not found for this receipt")
        
        target_total = round(float(ri["quantity"]) * float(ri["price_paid"]), 2)

        # 3. Validation: Total amount should match target_total (allow small epsilon for float precision)
        total_amount = sum(o.amount for o in payload.owners)
        if abs(total_amount - target_total) > 0.001:
            raise HTTPException(status_code=400, detail=f"Total amount must be {target_total} (got {total_amount})")

        # 4. Atomic update: Delete old owners, Insert new ones
        cur.execute("DELETE FROM item_owners WHERE receipt_item_id = %s", (receipt_item_id,))
        
        for owner in payload.owners:
            cur.execute("""
                INSERT INTO item_owners (receipt_item_id, user_id, amount)
                VALUES (%s, %s, %s)
            """, (receipt_item_id, owner.id, owner.amount))
            
        conn.commit()
        return {"status": "success", "message": "Item owners updated successfully"}

    except HTTPException:
        if conn: conn.rollback()
        raise
    except Exception as e:
        if conn: conn.rollback()
        logger.error(f"Error updating item owners: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        if conn:
            cur.close()
            conn.close()

@router.get("/{receipt_id}/debts")
def get_receipt_debts(
    receipt_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Calculates debts for a specific receipt.
    Returns the payee and the share of each household member.
    """
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Verify membership and get payee
        cur.execute("""
            SELECT r.payee, r.household_id FROM receipts r
            JOIN household_members hm ON r.household_id = hm.household_id
            WHERE r.id = %s AND hm.user_id = %s AND hm.is_active = TRUE;
        """, (receipt_id, user_id))
        
        receipt_info = cur.fetchone()
        if not receipt_info:
            raise HTTPException(status_code=403, detail="Access denied: You are not a member of the household this receipt belongs to")

        payee_id = receipt_info['payee']

        # 2. Calculate sum of shares per user directly from 'amount' column
        cur.execute("""
            SELECT 
                io.user_id,
                SUM(io.amount) as total_share
            FROM receipt_items ri
            JOIN item_owners io ON ri.id = io.receipt_item_id
            WHERE ri.receipt_id = %s AND io.settled = FALSE
            GROUP BY io.user_id;
        """, (receipt_id,))
        
        shares = cur.fetchall()
        
        payee_share = 0
        debtors = []
        
        for s in shares:
            u_id = s['user_id']
            u_share = float(s['total_share'])
            
            if u_id == payee_id:
                payee_share = u_share
            else:
                debtors.append({
                    "debtor": u_id,
                    "debtor_share": u_share
                })

        return {
            "payee": payee_id,
            "payee_share": payee_share,
            "debtors": debtors
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating debts for receipt {receipt_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        if conn:
            cur.close()
            conn.close()

@router.delete("/{receipt_id}")
def delete_receipt(
    receipt_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Deletes a specific receipt and its associated items/owners.
    Only the payee who is still a member of the household can delete it.
    """
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Fetch receipt to check payee and household_id
        cur.execute("SELECT payee, household_id FROM receipts WHERE id = %s", (receipt_id,))
        receipt = cur.fetchone()
        
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
            
        if receipt['payee'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied: Only the payee can delete this receipt")

        # 2. Verify membership in the household
        cur.execute("SELECT 1 FROM household_members WHERE household_id = %s AND user_id = %s AND is_active = TRUE", (receipt['household_id'], user_id))
        if not cur.fetchone():
            raise HTTPException(status_code=403, detail="Access denied: You are no longer a member of this household")

        # 3. Delete associated records
        # item_owners -> receipt_items -> receipts
        cur.execute("SELECT id FROM receipt_items WHERE receipt_id = %s", (receipt_id,))
        ri_ids = [row['id'] for row in cur.fetchall()]
        
        if ri_ids:
            cur.execute("DELETE FROM item_owners WHERE receipt_item_id = ANY(%s)", (ri_ids,))
            cur.execute("DELETE FROM receipt_items WHERE receipt_id = %s", (receipt_id,))
            
        cur.execute("DELETE FROM receipts WHERE id = %s", (receipt_id,))
        
        conn.commit()
        return {"status": "success", "message": "Receipt deleted successfully"}

    except HTTPException:
        if conn: conn.rollback()
        raise
    except Exception as e:
        if conn: conn.rollback()
        logger.error(f"Error deleting receipt {receipt_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        if conn:
            cur.close()
            conn.close()

