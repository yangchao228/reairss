Component({
  properties: {
    title: { type: String, value: "" },
    rightText: { type: String, value: "" },
    showBack: { type: Boolean, value: false },
    nav: { type: Object, value: { statusBarHeight: 0, navBarHeight: 44 } }
  },
  methods: {
    onBackTap() {
      wx.navigateBack({ delta: 1 });
    },
    onRightTap() {
      this.triggerEvent("righttap");
    }
  }
});

