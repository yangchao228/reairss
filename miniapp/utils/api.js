const { request } = require("./client");
const { getSources: getMockSources, getFeed: getMockFeed, getContentById } = require("./mock");
const { getSubscribedIds, subscribe, unsubscribe } = require("./subscriptions");
const { timeAgo } = require("./time");

function normalizeSource(item) {
  return {
    id: item.id,
    name: item.name,
    desc: item.description || item.desc || "",
    category: item.category || "",
    domain: item.domain || "",
    homepage_url: item.homepage_url || "",
    feed_url: item.feed_url || "",
    subscribed: !!item.subscribed,
  };
}

function normalizeFeedItem(item) {
  const publishedAt = item.published_at ? new Date(item.published_at).getTime() : Date.now();
  return {
    id: item.id,
    source_id: item.source ? item.source.id : item.source_id,
    source_name: item.source_name || (item.source && item.source.name) || "",
    title: item.title,
    raw_summary: item.raw_summary || item.summary || "",
    link_url: item.link_url,
    domain: item.domain || "",
    published_at: publishedAt,
    published_ago: timeAgo(publishedAt),
  };
}

function normalizeContent(item) {
  if (!item) return null;
  const publishedAt = item.published_at ? new Date(item.published_at).getTime() : Date.now();
  return {
    id: item.id,
    title: item.title,
    source_id: item.source ? item.source.id : item.source_id,
    source_name: item.source_name || (item.source && item.source.name) || "",
    raw_summary: item.raw_summary || item.summary || "",
    link_url: item.link_url,
    domain: item.domain || "",
    published_at: publishedAt,
    published_ago: timeAgo(publishedAt),
  };
}

function buildSubscribedSourcesFromLocal() {
  const subscribed = new Set(getSubscribedIds());
  return getMockSources()
    .filter((item) => subscribed.has(item.id))
    .map((item) => ({ ...item, subscribed: true }));
}

async function listSources() {
  try {
    const res = await request({ url: "/api/v1/sources" });
    return (res.items || []).map(normalizeSource);
  } catch (err) {
    const subscribed = new Set(getSubscribedIds());
    return getMockSources().map((item) => ({ ...item, subscribed: subscribed.has(item.id) }));
  }
}

async function listSubscriptions() {
  try {
    const res = await request({ url: "/api/v1/subscriptions" });
    return (res.items || []).map(normalizeSource);
  } catch (err) {
    return buildSubscribedSourcesFromLocal();
  }
}

async function subscribeSource(sourceId) {
  try {
    await request({
      url: "/api/v1/subscriptions",
      method: "POST",
      data: { source_id: Number(sourceId) },
    });
  } catch (err) {
    subscribe(sourceId);
  }
}

async function unsubscribeSource(sourceId) {
  try {
    await request({
      url: `/api/v1/subscriptions/${Number(sourceId)}`,
      method: "DELETE",
    });
  } catch (err) {
    unsubscribe(sourceId);
  }
}

async function listFeed({ timeRange = "24h", cursor = "", limit = 20, sourceId = null } = {}) {
  try {
    const query = [
      `time_range=${encodeURIComponent(timeRange)}`,
      `limit=${encodeURIComponent(limit)}`,
    ];
    if (cursor) query.push(`cursor=${encodeURIComponent(cursor)}`);
    if (sourceId) query.push(`source_id=${encodeURIComponent(sourceId)}`);
    const res = await request({ url: `/api/v1/feed?${query.join("&")}` });
    return {
      items: (res.items || []).map(normalizeFeedItem),
      next_cursor: res.next_cursor || "",
      has_more: !!res.has_more,
    };
  } catch (err) {
    return getMockFeed({
      subscribedSourceIds: getSubscribedIds(),
      timeRange,
      cursor: Number(cursor) || 0,
      limit,
      sourceId,
    });
  }
}

async function getContentDetail(contentId) {
  try {
    const res = await request({ url: `/api/v1/content/${Number(contentId)}` });
    return normalizeContent(res);
  } catch (err) {
    return getContentById(contentId);
  }
}

module.exports = {
  getContentDetail,
  listFeed,
  listSources,
  listSubscriptions,
  subscribeSource,
  unsubscribeSource,
};
