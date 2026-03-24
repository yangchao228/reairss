#!/usr/bin/env python3

import argparse
import json
import sys
import uuid
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


@dataclass
class Response:
    status: int
    payload: dict[str, Any]


class SmokeFailure(RuntimeError):
    pass


def request_json(base_url: str, path: str, device_id: str, method: str = "GET", data: dict[str, Any] | None = None) -> Response:
    body = None if data is None else json.dumps(data).encode("utf-8")
    req = Request(
        f"{base_url}{path}",
        data=body,
        method=method,
        headers={
            "Content-Type": "application/json",
            "X-Device-Id": device_id,
        },
    )
    try:
        with urlopen(req, timeout=10) as resp:
            return Response(resp.status, json.loads(resp.read().decode("utf-8")))
    except HTTPError as exc:
        return Response(exc.code, json.loads(exc.read().decode("utf-8")))
    except URLError as exc:
        raise SmokeFailure(f"request failed for {method} {path}: {exc}") from exc


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise SmokeFailure(message)


def expect_ok(resp: Response, label: str) -> dict[str, Any]:
    expect(resp.status == 200, f"{label}: expected HTTP 200, got {resp.status}")
    expect(resp.payload.get("code") == 0, f"{label}: expected code=0, got {resp.payload.get('code')}")
    expect(bool(resp.payload.get("trace_id")), f"{label}: missing trace_id")
    return resp.payload["data"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Run demo smoke checks against the reairss API.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="API base URL, default: http://127.0.0.1:8000")
    parser.add_argument("--device-id", default=None, help="Optional fixed device id used for subscription/feed checks")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    device_id = args.device_id or f"demo-smoke-{uuid.uuid4().hex[:8]}"

    try:
        health = expect_ok(request_json(base_url, "/health", device_id), "health")
        expect(health.get("status") == "healthy", "health: expected status=healthy")

        sources = expect_ok(request_json(base_url, "/api/v1/sources", device_id), "sources")
        items = sources.get("items") or []
        expect(len(items) == 5, f"sources: expected 5 demo sources, got {len(items)}")
        expect(all(not item.get("subscribed") for item in items), "sources: expected all subscribed=false before setup")

        cleanup = request_json(base_url, "/api/v1/subscriptions/1", device_id, method="DELETE")
        expect(
            (cleanup.status == 200 and cleanup.payload.get("code") == 0)
            or (cleanup.status == 404 and cleanup.payload.get("code") == 40002),
            f"cleanup subscription: unexpected response {cleanup.status} / {cleanup.payload.get('code')}",
        )

        subscribe = expect_ok(
            request_json(base_url, "/api/v1/subscriptions", device_id, method="POST", data={"source_id": 1}),
            "create subscription",
        )
        expect(subscribe.get("source_id") == 1, "create subscription: expected source_id=1")
        expect(subscribe.get("subscribed") is True, "create subscription: expected subscribed=true")

        subscriptions = expect_ok(request_json(base_url, "/api/v1/subscriptions", device_id), "subscriptions")
        subscribed_ids = {item["id"] for item in subscriptions.get("items") or []}
        expect(1 in subscribed_ids, "subscriptions: expected source 1 in subscription list")

        feed_page_1 = expect_ok(
            request_json(base_url, "/api/v1/feed?time_range=7d&limit=5", device_id),
            "feed page 1",
        )
        page_1_items = feed_page_1.get("items") or []
        expect(len(page_1_items) == 5, f"feed page 1: expected 5 items, got {len(page_1_items)}")
        expect(feed_page_1.get("has_more") is True, "feed page 1: expected has_more=true")
        next_cursor = feed_page_1.get("next_cursor") or ""
        expect(bool(next_cursor), "feed page 1: expected non-empty next_cursor")

        content_id = page_1_items[0]["id"]
        content = expect_ok(request_json(base_url, f"/api/v1/content/{content_id}", device_id), "content detail")
        expect(content.get("id") == content_id, "content detail: unexpected id")
        expect(bool(content.get("source_name")), "content detail: missing source_name")

        redirect = expect_ok(request_json(base_url, f"/api/v1/redirect/{content_id}", device_id), "redirect")
        expect(redirect.get("content_id") == content_id, "redirect: unexpected content_id")
        expect(bool(redirect.get("domain")), "redirect: missing domain")

        duplicate = request_json(
            base_url,
            "/api/v1/subscriptions",
            device_id,
            method="POST",
            data={"source_id": 1},
        )
        expect(duplicate.status == 409, f"duplicate subscription: expected HTTP 409, got {duplicate.status}")
        expect(duplicate.payload.get("code") == 40003, f"duplicate subscription: expected code=40003, got {duplicate.payload.get('code')}")

        feed_page_2 = expect_ok(
            request_json(base_url, f"/api/v1/feed?time_range=7d&limit=5&cursor={quote(next_cursor)}", device_id),
            "feed page 2",
        )
        page_2_items = feed_page_2.get("items") or []
        expect(len(page_2_items) == 5, f"feed page 2: expected 5 items, got {len(page_2_items)}")
        page_1_ids = {item["id"] for item in page_1_items}
        page_2_ids = {item["id"] for item in page_2_items}
        expect(page_1_ids.isdisjoint(page_2_ids), "feed page 2: expected no overlap with page 1")

    except SmokeFailure as exc:
        print(f"[FAIL] {exc}", file=sys.stderr)
        return 1

    print("[PASS] demo smoke checks succeeded")
    print(f"base_url={base_url}")
    print(f"device_id={device_id}")
    print("verified=health,sources,subscriptions,feed,content,redirect,duplicate,cursor")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
