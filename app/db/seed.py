from __future__ import annotations

from datetime import datetime, timedelta, timezone
import sqlite3


DEMO_SOURCES = [
    {
        "name": "Hacker News",
        "category": "科技",
        "feed_url": "https://news.ycombinator.com/rss",
        "homepage_url": "https://news.ycombinator.com",
        "update_freq": "high",
        "description": "科技与创业新闻聚合",
        "status": "active",
        "popularity": 98,
    },
    {
        "name": "The Verge",
        "category": "科技",
        "feed_url": "https://www.theverge.com/rss/index.xml",
        "homepage_url": "https://www.theverge.com",
        "update_freq": "high",
        "description": "消费电子与科技媒体",
        "status": "active",
        "popularity": 92,
    },
    {
        "name": "BBC World",
        "category": "新闻",
        "feed_url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "homepage_url": "https://www.bbc.com",
        "update_freq": "high",
        "description": "全球新闻与深度报道",
        "status": "active",
        "popularity": 90,
    },
    {
        "name": "NYT Technology",
        "category": "科技",
        "feed_url": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
        "homepage_url": "https://www.nytimes.com",
        "update_freq": "medium",
        "description": "技术趋势与商业观察",
        "status": "active",
        "popularity": 84,
    },
    {
        "name": "Indie Hackers",
        "category": "产品",
        "feed_url": "https://www.indiehackers.com/feed.xml",
        "homepage_url": "https://www.indiehackers.com",
        "update_freq": "medium",
        "description": "独立开发者与产品故事",
        "status": "active",
        "popularity": 80,
    },
]

DEMO_TITLES = [
    "从 0 到 1：产品冷启动的 7 个关键动作",
    "AI 摘要的工程化：如何让体验不被失败率拖垮",
    "为什么 RSS 仍然值得做：信息流的另一种可能",
    "现代前端的简洁 UI：用排版而不是阴影建立层级",
    "小程序外链中转页：审核与安全的最低成本方案",
]

DEMO_SUMMARY = "这是一段用于 Demo 联调的摘要文本。控制在 50-80 字左右，强调标题、元信息与摘要三层结构。"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def seed_demo_data(conn: sqlite3.Connection) -> None:
    source_count = conn.execute("SELECT COUNT(*) FROM rss_source").fetchone()[0]
    content_count = conn.execute("SELECT COUNT(*) FROM content_item").fetchone()[0]

    if source_count == 0:
        for source in DEMO_SOURCES:
            conn.execute(
                """
                INSERT INTO rss_source (
                  name, category, feed_url, homepage_url, update_freq, description,
                  status, popularity, last_item_published_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    source["name"],
                    source["category"],
                    source["feed_url"],
                    source["homepage_url"],
                    source["update_freq"],
                    source["description"],
                    source["status"],
                    source["popularity"],
                    _to_iso(_utc_now()),
                ),
            )

    if content_count == 0:
        rows = conn.execute("SELECT id, name, homepage_url FROM rss_source ORDER BY id").fetchall()
        now = _utc_now()
        counter = 0
        for idx in range(60):
            source = rows[idx % len(rows)]
            published_at = now - timedelta(hours=idx * 2)
            link_url = f"{source['homepage_url'].rstrip('/')}/story/{idx + 1000}"
            title = DEMO_TITLES[idx % len(DEMO_TITLES)]
            conn.execute(
                """
                INSERT OR IGNORE INTO content_item (
                  source_id, title, link_url, author, published_at, guid, raw_summary
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    source["id"],
                    title,
                    link_url,
                    source["name"],
                    _to_iso(published_at),
                    f"demo-{source['id']}-{idx + 1}",
                    DEMO_SUMMARY,
                ),
            )
            counter += 1

        if counter:
            for source in rows:
                latest = conn.execute(
                    "SELECT published_at FROM content_item WHERE source_id = ? ORDER BY published_at DESC, id DESC LIMIT 1",
                    (source["id"],),
                ).fetchone()
                if latest:
                    conn.execute(
                        "UPDATE rss_source SET last_item_published_at = ?, updated_at = datetime('now') WHERE id = ?",
                        (latest["published_at"], source["id"]),
                    )

    conn.commit()
