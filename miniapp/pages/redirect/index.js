const { getContentDetail } = require("../../utils/api");

Page({
  data: {
    nav: null,
    theme: "light",
    themeMode: "system",
    themeClass: "theme-light",
    url: "",
    domain: ""
  },

  async onLoad(options) {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      nav: app.globalData.nav,
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light",
      url: "",
      domain: ""
    });
    const content = await getContentDetail(options && options.id);
    this.setData({
      url: (content && content.link_url) || "",
      domain: (content && content.domain) || ""
    });
  },

  onShow() {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({ themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light" });
  },

  continueVisit() {
    if (!this.data.url) return;
    const encoded = encodeURIComponent(this.data.url);
    wx.navigateTo({ url: `/pages/webview/index?url=${encoded}` });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
