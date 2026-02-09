function getJSON(key, fallbackValue) {
  const raw = wx.getStorageSync(key);
  if (!raw) return fallbackValue;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallbackValue;
  }
}

function setJSON(key, value) {
  wx.setStorageSync(key, JSON.stringify(value));
}

module.exports = { getJSON, setJSON };

