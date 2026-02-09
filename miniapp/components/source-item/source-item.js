Component({
  properties: {
    source: { type: Object, value: null },
    subscribed: { type: Boolean, value: false }
  },
  methods: {
    onTap() {
      const id = this.data.source && this.data.source.id;
      this.triggerEvent("tapitem", { id });
    },
    onToggle() {
      const id = this.data.source && this.data.source.id;
      this.triggerEvent("toggle", { id, subscribed: this.data.subscribed });
    }
  }
});
