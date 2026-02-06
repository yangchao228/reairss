const BASE_URL = "https://your-api.example.com";
const APP_VERSION = "1.0.0";

function getDeviceId() {
  let deviceId = wx.getStorageSync("device_id");
  if (!deviceId) {
    deviceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    wx.setStorageSync("device_id", deviceId);
  }
  return deviceId;
}

function getSessionId() {
  let sessionId = wx.getStorageSync("session_id");
  if (!sessionId) {
    sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    wx.setStorageSync("session_id", sessionId);
  }
  return sessionId;
}

function request({ url, method = "GET", data = {}, header = {} }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        "X-Platform": "wx",
        "X-App-Version": APP_VERSION,
        "X-Device-Id": getDeviceId(),
        "X-Session-Id": getSessionId(),
        ...header,
      },
      success: (res) => resolve(res.data),
      fail: (err) => reject(err),
    });
  });
}

module.exports = { request };
