const { getJSON, setJSON } = require("./storage");

const KEY = "feed_source_filter_v1";

function setFeedSourceFilter({ sourceId, sourceName }) {
  setJSON(KEY, { sourceId: Number(sourceId) || null, sourceName: sourceName || "" });
}

function consumeFeedSourceFilter() {
  const v = getJSON(KEY, null);
  if (!v) return null;
  setJSON(KEY, null);
  if (!v.sourceId) return null;
  return { sourceId: Number(v.sourceId), sourceName: v.sourceName || "" };
}

module.exports = { setFeedSourceFilter, consumeFeedSourceFilter };

