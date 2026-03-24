from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel

from app.core.db import get_db
from app.core.response import error_response, success


router = APIRouter()


class SubscriptionBody(BaseModel):
    source_id: int


def _serialize_subscription(row: sqlite3.Row) -> dict:
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
        "subscribed": True,
        "created_at": row["created_at"],
        "latest_item_published_at": row["latest_item_published_at"] or "",
    }


@router.get("/subscriptions")
def list_subscriptions(
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
    db: sqlite3.Connection = Depends(get_db),
):
    if not x_device_id:
        return error_response(40001, "缺少 X-Device-Id", http_status=400)

    rows = db.execute(
        """
        SELECT
          s.*,
          sub.created_at,
          MAX(c.published_at) AS latest_item_published_at
        FROM subscription sub
        JOIN rss_source s ON s.id = sub.source_id
        LEFT JOIN content_item c ON c.source_id = s.id
        WHERE sub.device_id = ?
        GROUP BY sub.id, s.id
        ORDER BY latest_item_published_at DESC, sub.created_at DESC, s.id ASC
        """,
        (x_device_id,),
    ).fetchall()
    return success({"items": [_serialize_subscription(row) for row in rows]})


@router.post("/subscriptions")
def create_subscription(
    body: SubscriptionBody,
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
    db: sqlite3.Connection = Depends(get_db),
):
    if not x_device_id:
        return error_response(40001, "缺少 X-Device-Id", http_status=400)

    source = db.execute("SELECT id FROM rss_source WHERE id = ? AND status = 'active'", (body.source_id,)).fetchone()
    if not source:
        return error_response(40002, "源不存在", http_status=404)

    existing = db.execute(
        "SELECT id FROM subscription WHERE device_id = ? AND source_id = ?",
        (x_device_id, body.source_id),
    ).fetchone()
    if existing:
        return error_response(40003, "已订阅该源", http_status=409)

    db.execute(
        "INSERT INTO subscription (device_id, source_id) VALUES (?, ?)",
        (x_device_id, body.source_id),
    )
    db.commit()
    return success({"source_id": body.source_id, "subscribed": True}, message="subscribed")


@router.delete("/subscriptions/{source_id}")
def delete_subscription(
    source_id: int,
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
    db: sqlite3.Connection = Depends(get_db),
):
    if not x_device_id:
        return error_response(40001, "缺少 X-Device-Id", http_status=400)

    cursor = db.execute(
        "DELETE FROM subscription WHERE device_id = ? AND source_id = ?",
        (x_device_id, source_id),
    )
    db.commit()
    if cursor.rowcount == 0:
        return error_response(40002, "订阅不存在", http_status=404)
    return success({"source_id": source_id, "subscribed": False}, message="unsubscribed")
