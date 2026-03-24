const { getContentDetail } = require("../../utils/api");

Page({
  data: {
    nav: null,
    theme: "light",
    themeMode: "system",
    themeClass: "theme-light",
    content: null
  },

  async onLoad(options) {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      nav: app.globalData.nav,
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light",
      content: null
    });
    const content = await getContentDetail(options && options.id);
    this.setData({ content });
  },

  onShow() {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({ themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light" });
  },

  goRedirect() {
    const id = this.data.content && this.data.content.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/redirect/index?id=${id}` });
  }
});
