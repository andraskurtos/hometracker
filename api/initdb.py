# init_db.py
import psycopg2
from config import DB_CONFIG, logger

# The exact SQL I gave you earlier
CREATE_USERS_TABLE_SQL = """
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    gender VARCHAR(50),
    date_of_birth DATE,
    profile_pic_url TEXT,
    revolut_username VARCHAR(100),
    discord_id VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""

def setup_database():
    try:
        logger.info("Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        logger.info("Creating users table...")
        cur.execute(CREATE_USERS_TABLE_SQL)
        
        conn.commit()
        logger.info("✅ Database setup complete! Users table created.")
        
    except Exception as e:
        logger.error(f"❌ Failed to setup database: {e}")
    finally:
        if 'cur' in locals() and cur: cur.close()
        if 'conn' in locals() and conn: conn.close()

if __name__ == "__main__":
    setup_database()