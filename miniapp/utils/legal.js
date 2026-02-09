const LEGAL_ACCEPTED_KEY = "legal_accepted_v1";

function ensureLegalAccepted() {
  const accepted = wx.getStorageSync(LEGAL_ACCEPTED_KEY);
  if (accepted) return;

  wx.showModal({
    title: "使用前请阅读并同意",
    content: "为继续使用，请阅读并同意《用户协议》和《隐私协议》。",
    confirmText: "同意",
    cancelText: "退出",
    success: (res) => {
      if (res.confirm) {
        wx.setStorageSync(LEGAL_ACCEPTED_KEY, true);
      } else {
        if (wx.exitMiniProgram) {
          wx.exitMiniProgram();
        }
      }
    },
  });
}

module.exports = { ensureLegalAccepted };

