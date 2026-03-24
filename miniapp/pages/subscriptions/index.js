const { listSubscriptions, unsubscribeSource } = require("../../utils/api");
const { setFeedSourceFilter } = require("../../utils/feedFilter");

Page({
  data: {
    nav: null,
    theme: "light",
    themeMode: "system",
    themeClass: "theme-light",

    subscribedIds: [],
    subscribedSources: [],
    showEmpty: true
  },

  onLoad() {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      nav: app.globalData.nav,
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light"
    });
    this.refresh();
  },

  onShow() {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light"
    });
    this.refresh();
  },

  async refresh() {
    try {
      const subscribedSources = await listSubscriptions();
      this.setData({
        subscribedIds: subscribedSources.map((item) => item.id),
        subscribedSources,
        showEmpty: subscribedSources.length === 0
      });
    } catch (err) {
      this.setData({ subscribedIds: [], subscribedSources: [], showEmpty: true });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/discover/index" });
  },

  openSourceFeed(e) {
    const id = e.detail && e.detail.id;
    if (!id) return;
    const source = this.data.subscribedSources.find((s) => s.id === id);
    setFeedSourceFilter({ sourceId: id, sourceName: (source && source.name) || "" });
    wx.switchTab({ url: "/pages/feed/index" });
  },

  onToggleSubscribe(e) {
    const { id } = e.detail || {};
    if (!id) return;
    wx.showModal({
      title: "取消订阅？",
      content: "取消后，该源内容将从阅读流中隐藏。",
      confirmText: "取消订阅",
      confirmColor: "#E5484D",
      success: (res) => {
        if (!res.confirm) return;
        unsubscribeSource(id).then(() => this.refresh());
      }
    });
  }
});
