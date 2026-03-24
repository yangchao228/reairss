from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone
import json
from urllib.parse import urlparse


TIME_RANGE_TO_DELTA = {
    "24h": timedelta(hours=24),
    "3d": timedelta(days=3),
    "7d": timedelta(days=7),
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_limit(limit: int | None, default: int = 20, max_value: int = 50) -> int:
    if limit is None:
        return default
    return max(1, min(limit, max_value))


def get_cutoff_iso(time_range: str | None) -> str:
    delta = TIME_RANGE_TO_DELTA.get(time_range or "24h", TIME_RANGE_TO_DELTA["24h"])
    return (datetime.now(timezone.utc) - delta).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def encode_cursor(published_at: str, item_id: int) -> str:
    payload = {"published_at": published_at, "id": item_id}
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")


def decode_cursor(cursor: str | None) -> tuple[str, int] | None:
    if not cursor:
        return None
    try:
        payload = json.loads(base64.urlsafe_b64decode(cursor.encode("utf-8")).decode("utf-8"))
        published_at = payload["published_at"]
        item_id = int(payload["id"])
    except Exception:
        return None
    return published_at, item_id


def extract_domain(url: str | None) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    return parsed.netloc
