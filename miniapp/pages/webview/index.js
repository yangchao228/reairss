Page({
  data: {
    nav: null,
    theme: "light",
    themeMode: "system",
    themeClass: "theme-light",
    url: ""
  },

  onLoad(options) {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      nav: app.globalData.nav,
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light",
      url: options && options.url ? decodeURIComponent(options.url) : ""
    });
  },

  onShow() {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({ themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light" });
  }
});
