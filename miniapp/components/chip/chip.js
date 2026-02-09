Component({
  properties: {
    text: { type: String, value: "" },
    value: { type: String, value: "" },
    selected: { type: Boolean, value: false }
  },
  methods: {
    onTap() {
      this.triggerEvent("change", { value: this.data.value });
    }
  }
});

