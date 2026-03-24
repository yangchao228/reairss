from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, Header, Query

from app.api.routes.common import decode_cursor, encode_cursor, extract_domain, get_cutoff_iso, parse_limit
from app.core.db import get_db
from app.core.response import error_response, success


router = APIRouter()


def _serialize_feed_item(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "source": {
            "id": row["source_id"],
            "name": row["source_name"],
            "category": row["category"],
        },
        "title": row["title"],
        "link_url": row["link_url"],
        "published_at": row["published_at"],
        "summary": row["raw_summary"] or "",
        "raw_summary": row["raw_summary"] or "",
        "ai_ready": False,
        "tags": [],
        "source_name": row["source_name"],
        "domain": extract_domain(row["link_url"]),
    }


@router.get("/feed")
def list_feed(
    cursor: str | None = Query(default=None),
    limit: int | None = Query(default=20),
    source_id: int | None = Query(default=None),
    time_range: str | None = Query(default="24h"),
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
    db: sqlite3.Connection = Depends(get_db),
):
    if not x_device_id:
        return error_response(40001, "缺少 X-Device-Id", http_status=400)

    parsed_cursor = decode_cursor(cursor)
    if cursor and parsed_cursor is None:
        return error_response(40001, "cursor 无效", http_status=400)

    normalized_limit = parse_limit(limit)
    cutoff_iso = get_cutoff_iso(time_range)

    conditions = ["c.published_at >= ?"]
    params: list[object] = [cutoff_iso]

    if source_id:
        conditions.append("c.source_id = ?")
        params.append(source_id)
    else:
        conditions.append(
            "c.source_id IN (SELECT source_id FROM subscription WHERE device_id = ?)"
        )
        params.append(x_device_id)

    if parsed_cursor:
        published_at, item_id = parsed_cursor
        conditions.append("(c.published_at < ? OR (c.published_at = ? AND c.id < ?))")
        params.extend([published_at, published_at, item_id])

    rows = db.execute(
        f"""
        SELECT
          c.id,
          c.source_id,
          c.title,
          c.link_url,
          c.author,
          c.published_at,
          c.raw_summary,
          s.name AS source_name,
          s.category
        FROM content_item c
        JOIN rss_source s ON s.id = c.source_id
        WHERE {" AND ".join(conditions)}
        ORDER BY c.published_at DESC, c.id DESC
        LIMIT ?
        """,
        (*params, normalized_limit + 1),
    ).fetchall()

    has_more = len(rows) > normalized_limit
    visible_rows = rows[:normalized_limit]
    items = [_serialize_feed_item(row) for row in visible_rows]

    next_cursor = ""
    if has_more and visible_rows:
        last_row = visible_rows[-1]
        next_cursor = encode_cursor(last_row["published_at"], last_row["id"])

    return success({"items": items, "next_cursor": next_cursor, "has_more": has_more})
