Component({
  properties: {
    title: { type: String, value: "" },
    desc: { type: String, value: "" },
    ctaText: { type: String, value: "" }
  },
  methods: {
    onCtaTap() {
      this.triggerEvent("cta");
    }
  }
});

