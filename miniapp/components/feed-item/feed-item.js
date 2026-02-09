Component({
  properties: {
    item: { type: Object, value: null }
  },
  methods: {
    onTap() {
      const id = this.data.item && this.data.item.id;
      this.triggerEvent("tapitem", { id });
    }
  }
});
