const THEME_MODE_KEY = "theme_mode"; // system | light | dark
let cached = { mode: "system", system: "light", theme: "light" };

function resolveTheme(mode, systemTheme) {
  if (mode === "light" || mode === "dark") return mode;
  return systemTheme === "dark" ? "dark" : "light";
}

function getSystemTheme() {
  try {
    const info = wx.getSystemInfoSync();
    return info.theme === "dark" ? "dark" : "light";
  } catch (e) {
    return "light";
  }
}

function initTheme(app) {
  const storedMode = wx.getStorageSync(THEME_MODE_KEY) || "system";
  const system = getSystemTheme();
  const theme = resolveTheme(storedMode, system);
  cached = { mode: storedMode, system, theme };
  app.globalData.theme = cached;
  applyThemeToPages(app);

  if (wx.onThemeChange) {
    wx.onThemeChange(({ theme: next }) => {
      cached.system = next === "dark" ? "dark" : "light";
      cached.theme = resolveTheme(cached.mode, cached.system);
      app.globalData.theme = cached;
      applyThemeToPages(app);
    });
  }
}

function applyThemeToPages(app) {
  const pages = getCurrentPages();
  pages.forEach((p) => {
    if (typeof p.setData === "function") {
      p.setData({
        theme: cached.theme,
        themeMode: cached.mode,
        themeClass: cached.theme === "dark" ? "theme-dark" : "theme-light",
        nav: app.globalData.nav
      });
    }
  });
}

function setThemeMode(app, mode) {
  const nextMode = mode === "light" || mode === "dark" || mode === "system" ? mode : "system";
  wx.setStorageSync(THEME_MODE_KEY, nextMode);
  cached.mode = nextMode;
  cached.system = getSystemTheme();
  cached.theme = resolveTheme(cached.mode, cached.system);
  app.globalData.theme = cached;
  applyThemeToPages(app);
}

function getThemeSnapshot() {
  return { ...cached };
}

module.exports = { initTheme, setThemeMode, getThemeSnapshot, resolveTheme };
