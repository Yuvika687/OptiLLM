"""SQLAlchemy engine, session, and schema bootstrap."""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

_REQUEST_COLUMNS = {
    "api_key_id": "INTEGER",
    "intent": "VARCHAR(64)",
    "complexity_score": "FLOAT",
    "original_prompt": "TEXT",
    "optimized_prompt": "TEXT",
    "cache_entry_id": "INTEGER",
    "cache_similarity": "FLOAT",
    "fallback_used": "BOOLEAN DEFAULT FALSE",
    "embedding": "JSON",
    "baseline_cost_usd": "FLOAT DEFAULT 0",
    "status": "VARCHAR(32) DEFAULT 'success'",
    "error_message": "TEXT",
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Create tables and add any new columns on existing databases."""
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        existing = {
            row[0]
            for row in conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = 'requests'"
                )
            )
        }
        for name, col_type in _REQUEST_COLUMNS.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE requests ADD COLUMN {name} {col_type}"))
        for table in ("requests", "cache_entries", "api_keys", "documents"):
            try:
                conn.execute(
                    text(
                        f"ALTER TABLE {table} ALTER COLUMN created_at SET DEFAULT NOW()"
                    )
                )
            except Exception:
                continue
