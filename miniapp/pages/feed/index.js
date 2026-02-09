const { getFeed } = require("../../utils/mock");
const { getSubscribedIds } = require("../../utils/subscriptions");
const { consumeFeedSourceFilter } = require("../../utils/feedFilter");

Page({
  data: {
    nav: null,
    theme: "light",
    themeMode: "system",
    themeClass: "theme-light",

    timeRanges: [
      { label: "24h", value: "24h" },
      { label: "3d", value: "3d" },
      { label: "7d", value: "7d" }
    ],
    timeRange: "24h",

    hasSubscriptions: false,
    sourceId: null,
    sourceName: "",
    rightText: "",

    loading: true,
    loadingMore: false,
    items: [],
    cursor: 0,
    hasMore: false,

    showEmptyNoSubs: false,
    showEmptyNoUpdates: false,
    showFooter: false
  },

  onLoad(options) {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      nav: app.globalData.nav,
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light",
      sourceId: options && options.source_id ? Number(options.source_id) : null,
      sourceName: options && options.source_name ? decodeURIComponent(options.source_name) : ""
    });
    this.reload();
  },

  onShow() {
    const { theme } = this.data;
    this.setData({ themeClass: theme === "dark" ? "theme-dark" : "theme-light" });
    const filter = consumeFeedSourceFilter();
    if (filter && filter.sourceId) {
      this.setData({ sourceId: filter.sourceId, sourceName: filter.sourceName || "" });
      this.reload();
    }
  },

  onPullDownRefresh() {
    this.reload().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    this.loadMore();
  },

  onTimeRangeChange(e) {
    const value = (e.detail && e.detail.value) || "24h";
    if (value === this.data.timeRange) return;
    this.setData({ timeRange: value });
    this.reload();
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/discover/index" });
  },

  clearSourceFilter() {
    if (!this.data.sourceId) return;
    this.setData({ sourceId: null, sourceName: "" });
    this.reload();
  },

  onTapItem(e) {
    const id = e.detail && e.detail.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/content/index?id=${id}` });
  },

  syncComputed(next = {}) {
    const hasSubscriptions = typeof next.hasSubscriptions === "boolean" ? next.hasSubscriptions : this.data.hasSubscriptions;
    const sourceId = typeof next.sourceId === "number" ? next.sourceId : this.data.sourceId;
    const loading = typeof next.loading === "boolean" ? next.loading : this.data.loading;
    const items = Array.isArray(next.items) ? next.items : this.data.items;
    const hasItems = items.length > 0;

    const showEmptyNoSubs = !hasSubscriptions && !sourceId;
    const showEmptyNoUpdates = !showEmptyNoSubs && !loading && !hasItems;
    const showFooter = !showEmptyNoSubs && hasItems;
    const rightText = sourceId ? "清除" : "";

    this.setData({ showEmptyNoSubs, showEmptyNoUpdates, showFooter, rightText });
  },

  async reload() {
    this.setData({ loading: true, loadingMore: false, items: [], cursor: 0, hasMore: false });

    const subscribedSourceIds = getSubscribedIds();
    const hasSubscriptions = subscribedSourceIds.length > 0;
    this.setData({ hasSubscriptions });
    this.syncComputed({ hasSubscriptions, loading: true, items: [], sourceId: this.data.sourceId });
    if (!hasSubscriptions && !this.data.sourceId) {
      this.setData({ loading: false });
      this.syncComputed({ loading: false, items: [], sourceId: this.data.sourceId });
      return;
    }

    const res = getFeed({
      subscribedSourceIds,
      timeRange: this.data.timeRange,
      cursor: 0,
      limit: 20,
      sourceId: this.data.sourceId
    });

    this.setData({
      loading: false,
      items: res.items,
      cursor: res.next_cursor,
      hasMore: res.has_more
    });
    this.syncComputed({ loading: false, items: res.items, sourceId: this.data.sourceId });
  },

  async loadMore() {
    this.setData({ loadingMore: true });
    const subscribedSourceIds = getSubscribedIds();
    const res = getFeed({
      subscribedSourceIds,
      timeRange: this.data.timeRange,
      cursor: this.data.cursor,
      limit: 20,
      sourceId: this.data.sourceId
    });
    this.setData({
      loadingMore: false,
      items: [...this.data.items, ...res.items],
      cursor: res.next_cursor,
      hasMore: res.has_more
    });
    this.syncComputed({ items: [...this.data.items, ...res.items] });
  }
});
