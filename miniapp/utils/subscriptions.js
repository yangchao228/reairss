const { getJSON, setJSON } = require("./storage");

const KEY = "subscribed_source_ids_v1";

function getSubscribedIds() {
  const ids = getJSON(KEY, []);
  return Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];
}

function setSubscribedIds(ids) {
  const unique = Array.from(new Set((ids || []).map(Number).filter(Boolean)));
  setJSON(KEY, unique);
  return unique;
}

function isSubscribed(sourceId) {
  const id = Number(sourceId);
  return getSubscribedIds().includes(id);
}

function subscribe(sourceId) {
  const id = Number(sourceId);
  const next = setSubscribedIds([...getSubscribedIds(), id]);
  return next;
}

function unsubscribe(sourceId) {
  const id = Number(sourceId);
  const next = setSubscribedIds(getSubscribedIds().filter((x) => x !== id));
  return next;
}

module.exports = { getSubscribedIds, setSubscribedIds, isSubscribed, subscribe, unsubscribe };

