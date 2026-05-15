import psycopg2
from config import DB_CONFIG, logger

def run_migration():
    conn = None
    try:
        logger.info("Connecting to database for migration...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        logger.info("Creating settled_status enum type...")
        cur.execute("CREATE TYPE settled_status AS ENUM ('unsettled', 'pending', 'settled');")
        
        logger.info("Migrating item_owners.settled column to enum...")
        # Drop default first
        cur.execute("ALTER TABLE item_owners ALTER COLUMN settled DROP DEFAULT;")
        
        # Change type using existing values
        cur.execute("""
            ALTER TABLE item_owners 
            ALTER COLUMN settled TYPE settled_status 
            USING CASE 
                WHEN settled = TRUE THEN 'settled'::settled_status 
                ELSE 'unsettled'::settled_status 
            END;
        """)
        
        # Set new default
        cur.execute("ALTER TABLE item_owners ALTER COLUMN settled SET DEFAULT 'unsettled';")
        
        conn.commit()
        logger.info("✅ Migration successful!")
        
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"❌ Migration failed: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    run_migration()
