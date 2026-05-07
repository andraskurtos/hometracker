from datetime import date

from fastapi import APIRouter, Depends, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from typing import Optional

from config import DB_CONFIG, logger, UPLOAD_DIR
from routers.auth import get_current_user_id

import os
import uuid
import shutil
from fastapi import File, UploadFile


router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

# --- SCHEMAS ---
class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    revolut_username: Optional[str] = None
    discord_id: Optional[str] = None
    gender: Optional[str] = None
    profile_pic_url: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
# --- ENDPOINTS ---

# USER GET ENDPOINT
@router.get("/me")
def get_my_profile(user_id: str = Depends(get_current_user_id)):
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
                        SELECT id, email, first_name, last_name, display_name, gender, date_of_birth, profile_pic_url, revolut_username, discord_id, role, is_active, created_at, updated_at
                        FROM users
                        WHERE id = %s;
                    """, (user_id,))
        
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
# USER UPDATE ENDPOINT
@router.put("/me")
def update_my_profile(update_data: UserProfileUpdate, user_id: str = Depends(get_current_user_id)):
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if not update_dict:
        return {"message": "No data provided to update"}
    
    conn = None
    cur = None
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        set_clauses = []
        values = []
        
        for key, value in update_dict.items():
            set_clauses.append(f"{key} = %s")
            values.append(value)
            
        set_query = ", ".join(set_clauses)
        values.append(user_id)
        
        sql = f"UPDATE users SET {set_query}, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, email, first_name, last_name, display_name, gender, date_of_birth, profile_pic_url, revolut_username, discord_id, role, is_active, created_at, updated_at;"
        cur.execute(sql, tuple(values))
        updated_user = cur.fetchone()
        conn.commit()
        
        return {"status": "success", "message": "Profile updated", "data": updated_user}
    except psycopg2.Error as e:
        if conn: conn.rollback()
        logger.error(f"Database error updating user: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{user_id}_{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"/uploads/avatars/{unique_filename}"
    
    conn = None
    cur = None
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET profile_pic_url = %s WHERE id = %s",
            (avatar_url, user_id)
        )
        conn.commit()
        return {"avatar_url": avatar_url} 
    finally:
        if cur: cur.close()
        if conn: conn.close()


