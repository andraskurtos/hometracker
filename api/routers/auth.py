from datetime import datetime, timedelta, timezone
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from jose import jwt
import bcrypt

from config import DB_CONFIG, logger, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def get_password_hash(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class UserLogin(BaseModel):
    email: str
    password: str
    
class UserRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    
@router.post("/register")
def register_user(user: UserRegister):
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE email = %s", (user.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="User already registered with this email address!")
        
        hashed_pw = get_password_hash(user.password)
        cur.execute("""
                    INSERT INTO users (email, password_hash, first_name, last_name)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, email, first_name;
                    """, (user.email, hashed_pw, user.first_name, user.last_name))

        new_user = cur.fetchone()
        conn.commit()
        return {"message": "User created successfully!", "user": new_user}
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        if cur: cur.close()
        if conn: conn.close()
        
@router.post("/login")
def login_user(user: UserLogin):
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT id, email, password_hash, first_name FROM users WHERE email = %s", (user.email,))
        db_user = cur.fetchone()
        
        if not db_user or not verify_password(user.password, db_user['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        access_token = create_access_token(data={"sub": str(db_user['id'])})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "id": db_user['id'],
                "first_name": db_user['first_name']
            }
        }
        
    finally:
        if cur: cur.close()
        if conn: conn.close()
    
        
        