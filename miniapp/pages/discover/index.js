const { listSources, subscribeSource, unsubscribeSource } = require("../../utils/api");

function buildCategories(sources) {
  const cats = Array.from(new Set(sources.map((s) => s.category))).filter(Boolean);
  return [{ label: "全部", value: "all" }, ...cats.map((c) => ({ label: c, value: c }))];
}

Page({
  data: {
    nav: null,
    theme: "light",
    themeMode: "system",
    themeClass: "theme-light",

    q: "",
    category: "all",
    categories: [],
    sources: [],
    filtered: [],
    subscribedIds: [],
    showEmpty: false
  },

  onLoad() {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      nav: app.globalData.nav,
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light",
      sources: [],
      categories: [{ label: "全部", value: "all" }],
      subscribedIds: []
    });
    this.loadSources();
  },

  onShow() {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light"
    });
    this.loadSources();
  },

  async loadSources() {
    try {
      const sources = await listSources();
      const subscribedIds = sources.filter((item) => item.subscribed).map((item) => item.id);
      this.setData({
        sources,
        categories: buildCategories(sources),
        subscribedIds
      });
      this.applyFilter();
    } catch (err) {
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  onSearchInput(e) {
    this.setData({ q: e.detail.value || "" });
    this.applyFilter();
  },

  onCategoryChange(e) {
    const value = (e.detail && e.detail.value) || "all";
    if (value === this.data.category) return;
    this.setData({ category: value });
    this.applyFilter();
  },

  applyFilter() {
    const q = (this.data.q || "").trim().toLowerCase();
    const category = this.data.category;
    const subscribedSet = new Set(this.data.subscribedIds);
    const filtered = this.data.sources
      .filter((s) => (category === "all" ? true : s.category === category))
      .filter((s) => {
        if (!q) return true;
        const hay = `${s.name} ${s.desc} ${s.category}`.toLowerCase();
        return hay.includes(q);
      });
    const withSubscribed = filtered.map((s) => ({ ...s, subscribed: subscribedSet.has(s.id) }));
    this.setData({ filtered: withSubscribed, showEmpty: withSubscribed.length === 0 });
  },

  async onToggleSubscribe(e) {
    const { id, subscribed } = e.detail || {};
    if (!id) return;

    if (subscribed) {
      wx.showModal({
        title: "取消订阅？",
        content: "取消后，该源内容将从阅读流中隐藏。",
        confirmText: "取消订阅",
        confirmColor: "#E5484D",
        success: async (res) => {
          if (!res.confirm) return;
          await unsubscribeSource(id);
          await this.loadSources();
        }
      });
      return;
    }

    await subscribeSource(id);
    await this.loadSources();
  },
  onRowTap(e) {
    const id = e.detail && e.detail.id;
    if (!id) return;
    const row = this.data.filtered.find((s) => s.id === id);
    this.onToggleSubscribe({ detail: { id, subscribed: !!(row && row.subscribed) } });
  }
});
