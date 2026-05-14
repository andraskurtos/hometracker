import psycopg2
from config import DB_CONFIG, logger

MIGRATION_SQL = """
-- 1. Delete all receipt-related data
logger.info("Deleting all receipt data...")
DELETE FROM item_owners;
DELETE FROM receipt_items;
DELETE FROM receipts;
DELETE FROM items;
DELETE FROM stores;

-- 2. Modify schema
logger.info("Modifying schema...")
ALTER TABLE receipts DROP COLUMN settled;
ALTER TABLE item_owners ADD COLUMN settled BOOLEAN DEFAULT FALSE;
"""

# Actually, I should use separate cur.execute calls for better logging and control.

def run_migration():
    conn = None
    try:
        logger.info("Connecting to database for migration...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Delete all receipt data
        logger.info("Deleting data from item_owners...")
        cur.execute("DELETE FROM item_owners;")
        
        logger.info("Deleting data from receipt_items...")
        cur.execute("DELETE FROM receipt_items;")
        
        logger.info("Deleting data from receipts...")
        cur.execute("DELETE FROM receipts;")
        
        logger.info("Deleting data from items...")
        cur.execute("DELETE FROM items;")
        
        logger.info("Deleting data from stores...")
        cur.execute("DELETE FROM stores;")
        
        # 2. Modify schema
        logger.info("Dropping 'settled' column from 'receipts'...")
        cur.execute("ALTER TABLE receipts DROP COLUMN settled;")
        
        logger.info("Adding 'settled' column to 'item_owners'...")
        cur.execute("ALTER TABLE item_owners ADD COLUMN settled BOOLEAN DEFAULT FALSE;")
        
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
