const { getContentById } = require("../../utils/mock");

Page({
  data: {
    nav: null,
    theme: "light",
    themeMode: "system",
    themeClass: "theme-light",
    url: "",
    domain: ""
  },

  onLoad(options) {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    const content = getContentById(options && options.id);
    this.setData({
      nav: app.globalData.nav,
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light",
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
