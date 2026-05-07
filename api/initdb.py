# init_db.py
import psycopg2
from config import DB_CONFIG, logger

# The exact SQL I gave you earlier
CREATE_USERS_TABLE_SQL = """
-- 1. Create the Households Table
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    join_code VARCHAR(20) UNIQUE NOT NULL, -- Short code like 'A7X9-P2M4'
    base_currency VARCHAR(3) DEFAULT 'HUF',
    created_by UUID REFERENCES users(id), -- Links to the user who made it
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the Join Table (Members)
CREATE TABLE IF NOT EXISTS household_members (
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'admin' or 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- This ensures a user can't join the exact same household twice
    PRIMARY KEY (household_id, user_id) 
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