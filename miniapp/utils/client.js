const APP_VERSION = "1.0.0";

function getBaseUrl() {
  return wx.getStorageSync("api_base_url") || "http://127.0.0.1:8000";
}

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
      url: `${getBaseUrl()}${url}`,
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
      success: (res) => {
        const payload = res.data || {};
        if (res.statusCode >= 400) {
          reject(payload);
          return;
        }
        if (payload.code && payload.code !== 0) {
          reject(payload);
          return;
        }
        resolve(payload.data || {});
      },
      fail: (err) => reject(err),
    });
  });
}

module.exports = { request };
