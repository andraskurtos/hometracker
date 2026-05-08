# init_db.py
import psycopg2
from config import DB_CONFIG, logger

# The exact SQL I gave you earlier
CREATE_USERS_TABLE_SQL = """
-- 1. Create the Households Table
ALTER TABLE household_members ADD COLUMN is_active BOOLEAN DEFAULT true;
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