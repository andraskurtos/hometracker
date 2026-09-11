"""
Database initializer for HomeTracker.

`schema.sql` is the single source of truth for the database schema. This
project's stored data is disposable, so the canonical workflow is to rebuild
from scratch rather than run incremental migrations:

    python init_db.py --reset

That drops the `public` schema and re-applies `schema.sql`. Without `--reset`,
the schema is applied as-is, which is the correct invocation for a fresh
(empty) database.
"""

import argparse
import os

import psycopg2

from config import DB_CONFIG, logger

SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")


def load_schema_sql() -> str:
    """Return schema.sql with psql meta-commands removed.

    pg_dump emits `\\restrict` / `\\unrestrict` guard lines that only psql
    understands; psycopg2 chokes on them.
    """
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return "".join(line for line in lines if not line.lstrip().startswith("\\"))


def init_database(reset: bool = False):
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True

        with conn.cursor() as cur:
            if reset:
                logger.warning("--reset: dropping and recreating the 'public' schema (all data destroyed)")
                cur.execute("DROP SCHEMA IF EXISTS public CASCADE;")
                cur.execute("CREATE SCHEMA public;")

            logger.info("Applying schema.sql...")
            cur.execute(load_schema_sql())

        logger.info("Database initialized from schema.sql")
    except Exception as e:
        logger.error(f"Database init failed: {e}")
        raise
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the HomeTracker database from schema.sql")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="drop the 'public' schema before applying (destroys all data)",
    )
    args = parser.parse_args()
    init_database(reset=args.reset)
