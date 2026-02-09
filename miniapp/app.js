const { initTheme, setThemeMode, getThemeSnapshot } = require("./utils/theme");
const { ensureLegalAccepted } = require("./utils/legal");

App({
  globalData: {
    nav: null,
    theme: null,
  },

  onLaunch() {
    this.globalData.nav = this._getNavMetrics();
    initTheme(this);
  },

  onShow() {
    ensureLegalAccepted();
  },

  setThemeMode(mode) {
    setThemeMode(this, mode);
  },

  getThemeSnapshot() {
    return getThemeSnapshot();
  },

  _getNavMetrics() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;

    let capsule;
    try {
      capsule = wx.getMenuButtonBoundingClientRect();
    } catch (e) {
      capsule = { top: statusBarHeight + 6, height: 32, right: systemInfo.windowWidth - 8, width: 88 };
    }

    const navBarHeight = (capsule.top - statusBarHeight) * 2 + capsule.height;
    return {
      statusBarHeight,
      navBarHeight,
      capsule,
      windowWidth: systemInfo.windowWidth,
    };
  },
});

