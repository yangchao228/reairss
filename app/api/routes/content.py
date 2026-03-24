from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends

from app.api.routes.common import extract_domain
from app.core.db import get_db
from app.core.response import error_response, success


router = APIRouter()


def _serialize_content(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "link_url": row["link_url"],
        "published_at": row["published_at"],
        "raw_summary": row["raw_summary"] or "",
        "summary": row["raw_summary"] or "",
        "source": {
            "id": row["source_id"],
            "name": row["source_name"],
            "category": row["category"],
            "homepage_url": row["homepage_url"],
        },
        "source_name": row["source_name"],
        "domain": extract_domain(row["link_url"]),
        "ai_ready": False,
        "tags": [],
    }


@router.get("/content/{content_id}")
def get_content(content_id: int, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute(
        """
        SELECT
          c.id,
          c.source_id,
          c.title,
          c.link_url,
          c.published_at,
          c.raw_summary,
          s.name AS source_name,
          s.category,
          s.homepage_url
        FROM content_item c
        JOIN rss_source s ON s.id = c.source_id
        WHERE c.id = ?
        """,
        (content_id,),
    ).fetchone()

    if not row:
        return error_response(40002, "内容不存在", http_status=404)

    return success(_serialize_content(row))


@router.get("/redirect/{content_id}")
def get_redirect(content_id: int, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT id, link_url FROM content_item WHERE id = ?", (content_id,)).fetchone()
    if not row:
        return error_response(40002, "内容不存在", http_status=404)
    return success({"content_id": row["id"], "link_url": row["link_url"], "domain": extract_domain(row["link_url"])})
