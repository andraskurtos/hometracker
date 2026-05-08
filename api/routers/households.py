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

def verify_admin_status(cur, household_id: str, user_id: str):
    cur.execute("""
                    SELECT role FROM household_members
                    WHERE household_id = %s and user_id = %s
                """, (household_id, user_id))
    
    membership = cur.fetchone()
    if not membership:
        raise HTTPException(status_code=404, detail="Household not found or you are not a member")
    if membership['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can perform this action")
    

# --- SCHEMAS ---

class HouseholdCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_currency: str = "HUF"
    
class HouseholdJoin(BaseModel):
    join_code: str
    
class HouseholdUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_currency: Optional[str] = None
    
    
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
                        WHERE hm.user_id = %s AND h.is_active = true AND hm.is_active = TRUE
                        ORDER BY hm.joined_at DESC;
                    """, (user_id,))
        
        households = cur.fetchall()
        return households
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
@router.get("/{household_id}/members")
def get_household_members(household_id: str, user_id: str = Depends(get_current_user_id)):
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT 1 FROM household_members WHERE household_id = %s AND user_id = %s", (household_id, user_id))
        if not cur.fetchone():
            raise HTTPException(status_code=403, detail="You are not a member of this household")
        
        cur.execute("""
                    SELECT u.id, u.first_name, u.last_name, u.display_name, u.profile_pic_url, hm.role, hm.joined_at
                    FROM users u
                    JOIN household_members hm ON u.id = hm.user_id
                    WHERE hm.household_id = %s AND hm.is_active = true
                    ORDER BY hm.role ASC, hm.joined_at DESC;
                    """, (household_id,))
        return cur.fetchall()
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
@router.put("/{household_id}")
def update_household(household_id: str, update_data: HouseholdUpdate, user_id: str = Depends(get_current_user_id)):
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if not update_dict:
        return {"message":"No data provided to update"}
    
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        verify_admin_status(cur, household_id, user_id)
        
        set_clauses = []
        values = []
        for key, value in update_dict.items():
            set_clauses.append(f"{key} = %s")
            values.append(value)
        
        set_query = ", ".join(set_clauses)
        values.extend([household_id])
        
        cur.execute(f"""
                    UPDATE households SET {set_query}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s RETURNING id, name, description, base_currency;
                    """, tuple(values))
        
        updated_household = cur.fetchone()
        conn.commit()
        return {"status":"success", "data": updated_household}
    except psycopg2.Error as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail="Database error while updating household")
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
@router.put("/{household_id}/regenerate-code")
def regenerate_household_code(household_id: str, user_id: str = Depends(get_current_user_id)):
    new_code = generate_join_code
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        verify_admin_status(cur, household_id, user_id)
        
        cur.execute("""
                    UPDATE households SET join_code = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s RETURNING join_code;
                    """, (new_code, household_id))
        
        conn.commit()
        return {"message":"Join code regenerated", "new_code": cur.fetchone()["join_code"]}
    except psycopg2.Error as e:
        logger.error(f"Database error while regenerating join code for household {household_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error while regenerating join code")
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
@router.put("/{household-id}/deactivate/{target_user_id}")
def deactivate_member(household_id: str, target_user_id: str, user_id: str = Depends(get_current_user_id)):
    if user_id == target_user_id:
        raise HTTPException(status_code=400, detail="You cannot kick yourself. Use leave endpoint instead.")

    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        verify_admin_status(cur, household_id, user_id)
        
        cur.execute("SELECT created_by FROM households WHERE id = %s", (household_id,))
        if cur.fetchone()['created_by'] == target_user_id:
            raise HTTPException(status_code=400, detail="You cannot kick the creator of the household")
        
        cur.execute("""
                    UPDATE household_members
                    SET is_active = false
                    WHERE household_id = %s AND user_id = %s
                    RETURNING user_id;
                    """, (household_id, target_user_id))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User is not active in the household")
        
        conn.commit()
        return {"message": "User successfully deactivated from household"}
    except psycopg2.Error as e:
        logger.error(f"Database error while kicking user {target_user_id} from household {household_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error while kicking user from household")
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
        
    
    