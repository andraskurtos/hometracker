import psycopg2
from dotenv import load_dotenv

DB_CONFIG = {
    "dbname": "pantry_db",
    "user": "andrish",
    "password": "supersecret",
    "host": "127.0.0.1",
    "port": "5432"
}

def setup_normalized_db():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("Dropping old tables to make way for the new schema...")
    # Be careful with this in production! We drop them here so you can test cleanly.
    cur.execute("DROP TABLE IF EXISTS receipt_items, receipts, items, stores CASCADE;")
    cur.execute("DROP TYPE IF EXISTS payment_enum, size_enum CASCADE;")

    print("Creating ENUMs...")
    cur.execute("CREATE TYPE payment_enum AS ENUM ('CARD', 'CASH');")
    cur.execute("CREATE TYPE size_enum AS ENUM ('none', 'volume', 'weight', 'pcs');")

    print("Creating Tables...")
    
    # 1. STORE TABLE
    cur.execute("""
        CREATE TABLE stores (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            logo VARCHAR(500)
        );
    """)

    # 2. RECEIPT TABLE
    cur.execute("""
        CREATE TABLE receipts (
            id SERIAL PRIMARY KEY,
            store_id INTEGER REFERENCES stores(id) ON DELETE RESTRICT,
            total NUMERIC(10, 2) NOT NULL,
            payment_method payment_enum,
            payee_user_id INTEGER DEFAULT 0,
            settled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 3. ITEM CATALOG TABLE
    cur.execute("""
        CREATE TABLE items (
            id SERIAL PRIMARY KEY,
            receipt_name VARCHAR(255) UNIQUE NOT NULL, 
            name VARCHAR(255) NOT NULL,
            size NUMERIC(10, 2),
            size_type size_enum
        );
    """)

    # 4. RECEIPT_ITEM MERGE TABLE
    cur.execute("""
        CREATE TABLE receipt_items (
            receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
            item_id INTEGER REFERENCES items(id) ON DELETE RESTRICT,
            quantity INTEGER NOT NULL,
            price_paid NUMERIC(10, 2) NOT NULL,
            PRIMARY KEY (receipt_id, item_id)
        );
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ New schema successfully deployed!")




if __name__ == "__main__":
    setup_normalized_db()