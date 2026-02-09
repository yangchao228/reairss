const { timeAgo } = require("./time");

const sources = [
  { id: 1, name: "Hacker News", desc: "科技与创业新闻聚合", category: "科技", domain: "news.ycombinator.com" },
  { id: 2, name: "The Verge", desc: "消费电子与科技媒体", category: "科技", domain: "theverge.com" },
  { id: 3, name: "BBC World", desc: "全球新闻与深度报道", category: "新闻", domain: "bbc.com" },
  { id: 4, name: "NYT Technology", desc: "技术趋势与商业观察", category: "科技", domain: "nytimes.com" },
  { id: 5, name: "Indie Hackers", desc: "独立开发者与产品故事", category: "产品", domain: "indiehackers.com" }
];

function buildContent() {
  const now = Date.now();
  const items = [];
  let id = 1000;
  const titles = [
    "从 0 到 1：产品冷启动的 7 个关键动作",
    "AI 摘要的工程化：如何让体验不被失败率拖垮",
    "为什么 RSS 仍然值得做：信息流的另一种可能",
    "现代前端的简洁 UI：用排版而不是阴影建立层级",
    "小程序外链中转页：审核与安全的最低成本方案"
  ];

  for (let i = 0; i < 60; i += 1) {
    const source = sources[i % sources.length];
    const ts = now - i * 2 * 60 * 60 * 1000;
    items.push({
      id: id++,
      source_id: source.id,
      source_name: source.name,
      published_at: ts,
      published_ago: timeAgo(ts),
      title: titles[i % titles.length],
      raw_summary:
        "这是一段用于原型演示的摘要文本。控制在 50–80 字左右，强调信息层级：标题 / 元信息 / 摘要。",
      link_url: `https://${source.domain}/story/${id}`,
      domain: source.domain
    });
  }
  return items;
}

const contentItems = buildContent();

function getSources() {
  return sources.slice();
}

function getContentById(contentId) {
  const id = Number(contentId);
  return contentItems.find((x) => x.id === id) || null;
}

function getFeed({ subscribedSourceIds = [], timeRange = "24h", cursor = 0, limit = 20, sourceId } = {}) {
  const now = Date.now();
  const rangeMs =
    timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 : timeRange === "3d" ? 3 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const sid = sourceId ? Number(sourceId) : null;
  const allowed = new Set((sid ? [sid] : subscribedSourceIds).map(Number));

  const filtered = contentItems
    .filter((x) => (allowed.size ? allowed.has(x.source_id) : false))
    .filter((x) => now - x.published_at <= rangeMs)
    .sort((a, b) => b.published_at - a.published_at);

  const start = Number(cursor) || 0;
  const slice = filtered.slice(start, start + limit);
  const nextCursor = start + slice.length;
  return {
    items: slice,
    next_cursor: nextCursor,
    has_more: nextCursor < filtered.length
  };
}

module.exports = { getSources, getFeed, getContentById };

