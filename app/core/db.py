import os
import sqlite3
from typing import Iterator

from .config import settings


def _ensure_db_dir(db_path: str) -> None:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)


def get_db() -> Iterator[sqlite3.Connection]:
    _ensure_db_dir(settings.DB_PATH)
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
