import random
import string
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from routers.auth import get_current_user_id
from config import DB_CONFIG, logger

router = APIRouter(
    prefix="/api/household",
    tags=['Household']
)

# --- UTILS ---

def generate_join_code():
    chars = string.ascii_uppercase + string.digits
    part1 = "".join(random.choices(chars, k=4))
    part2 = "".join(random.choices(chars, k=4))
    return f"{part1}-{part2}"

# --- SCHEMAS ---

class HouseholdCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_currency: str = "HUF"
    
class HouseholdJoin(BaseModel):
    join_code: str
    
# --- ENDPOINTS ---

@router.post("/")
def create_household(household: HouseholdCreate, user_id : str = Depends(get_current_user_id)):
    join_code = generate_join_code()
    
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
                        INSERT INTO households (name, description, join_code, base_currency, created_by)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id, name, join_code, base_currency;
                    """, (household.name, household.description, join_code, household.base_currency, user_id))
        
        new_household = cur.fetchone()
        
        cur.execute("""
                        INSERT INTO household_members (household_id, user_id, role)
                        VALUES (%s, %s, 'admin');
                    """, (new_household["id"], user_id))
        
        conn.commit()
        return {"message": "Household created", "data": new_household}
    except psycopg2.Error as e:
        if conn: conn.rollback()
        logger.error(f"Database error creating household: {e}")
        raise HTTPException(status_code=500, detail="Could not create household")
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
@router.post("/join")
def join_household(payload: HouseholdJoin, user_id: str = Depends(get_current_user_id)):
    clean_code = payload.join_code.strip().upper()
    
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT id, name FROM households WHERE join_code = %s AND is_active = true;", (clean_code,))
        household = cur.fetchone()
        
        if not household:
            raise HTTPException(status_code=404, detail="Invalid or expired join code")
        
        cur.execute("""
                        SELECT 1 FROM household_members
                        WHERE household_id = %s AND user_id = %s;
                    """, (household['id'], user_id))
        
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="You are already a member of this household")
        
        cur.execute("""
                        INSERT INTO household_members (household_id, user_id, role)
                        VALUES (%s, %s, 'member');
                    """, (household['id'], user_id))
        
        conn.commit()
        return {"message": f"Successfully joined {household['name']}!", "household_id": household['id']}
        
    except psycopg2.Error as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail="Database error joining household")
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
@router.get("/me")
def get_my_households(user_id: str = Depends(get_current_user_id)):
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
                        SELECT h.id, h.name, h.description, h.join_code, h.base_currency, hm.role, hm.joined_at
                        FROM households h
                        JOIN household_members hm ON h.id = hm.household_id
                        WHERE hm.user_id = %s AND h.is_active = true
                        ORDER BY hm.joined_at DESC;
                    """, (user_id,))
        
        households = cur.fetchall()
        return households
    finally:
        if cur: cur.close()
        if conn: conn.close()
        