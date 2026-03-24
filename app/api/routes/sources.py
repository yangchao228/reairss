from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, Header, Query

from app.core.db import get_db
from app.core.response import error_response, success


router = APIRouter()


def _serialize_source(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "feed_url": row["feed_url"],
        "homepage_url": row["homepage_url"],
        "description": row["description"] or "",
        "update_freq": row["update_freq"],
        "status": row["status"],
        "popularity": row["popularity"],
        "last_item_published_at": row["last_item_published_at"] or "",
        "subscribed": bool(row["subscribed"]),
    }


@router.get("/sources")
def list_sources(
    category: str | None = Query(default=None),
    sort: str = Query(default="hot"),
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
    db: sqlite3.Connection = Depends(get_db),
):
    if sort not in {"hot", "alpha"}:
        return error_response(40001, "sort 仅支持 hot 或 alpha", http_status=400)

    conditions = ["s.status = 'active'"]
    params: list[object] = [x_device_id or ""]

    if category:
        conditions.append("s.category = ?")
        params.append(category)

    order_by = "s.popularity DESC, s.id ASC" if sort == "hot" else "s.name COLLATE NOCASE ASC, s.id ASC"

    rows = db.execute(
        f"""
        SELECT
          s.*,
          EXISTS(
            SELECT 1 FROM subscription sub
            WHERE sub.source_id = s.id AND sub.device_id = ?
          ) AS subscribed
        FROM rss_source s
        WHERE {" AND ".join(conditions)}
        ORDER BY {order_by}
        """
        ,
        params,
    ).fetchall()

    items = [_serialize_source(row) for row in rows]
    return success({"items": items, "total": len(items)})


@router.get("/sources/search")
def search_sources(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=50),
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
    db: sqlite3.Connection = Depends(get_db),
):
    keyword = q.strip().lower()
    rows = db.execute(
        """
        SELECT
          s.*,
          EXISTS(
            SELECT 1 FROM subscription sub
            WHERE sub.source_id = s.id AND sub.device_id = ?
          ) AS subscribed
        FROM rss_source s
        WHERE s.status = 'active'
          AND (
            lower(s.name) LIKE ?
            OR lower(s.category) LIKE ?
            OR lower(COALESCE(s.description, '')) LIKE ?
          )
        ORDER BY s.popularity DESC, s.id ASC
        LIMIT ?
        """,
        (x_device_id or "", f"%{keyword}%", f"%{keyword}%", f"%{keyword}%", limit),
    ).fetchall()

    items = []
    for row in rows:
        item = _serialize_source(row)
        item["match_score"] = 100 if keyword in row["name"].lower() else 80
        items.append(item)

    return success({"items": items, "total": len(items)})
