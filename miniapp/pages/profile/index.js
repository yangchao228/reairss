Page({
  data: {
    nav: null,
    theme: "light",
    themeMode: "system",
    themeClass: "theme-light"
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
  },

  onShow() {
    const app = getApp();
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light"
    });
  },

  onThemeModeChange(e) {
    const mode = e.detail.value;
    const app = getApp();
    if (app.setThemeMode) app.setThemeMode(mode);
    const snap = (app.getThemeSnapshot && app.getThemeSnapshot()) || {};
    this.setData({
      theme: snap.theme || "light",
      themeMode: snap.mode || "system",
      themeClass: (snap.theme || "light") === "dark" ? "theme-dark" : "theme-light"
    });
  },

  openUserAgreement() {
    wx.showModal({
      title: "用户协议",
      content: "原型占位：后续可替换为协议页面或富文本内容。",
      showCancel: false
    });
  },

  openPrivacyPolicy() {
    wx.showModal({
      title: "隐私协议",
      content: "原型占位：后续可替换为协议页面或富文本内容。",
      showCancel: false
    });
  }
});
