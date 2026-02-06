import os
import sqlite3
from pathlib import Path

from app.core.config import settings


def init_db(db_path: str | None = None) -> None:
    db_file = db_path or settings.DB_PATH
    os.makedirs(os.path.dirname(db_file), exist_ok=True)
    schema_path = Path(__file__).with_name("schema.sql")
    with sqlite3.connect(db_file) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.executescript(schema_path.read_text(encoding="utf-8"))
