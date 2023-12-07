AFRAME.registerComponent('volume-control', {
  schema: {
    music: {type: 'selector', default: '#music'}
  },

  init() {
    this.el.addEventListener('change', this.onChange.bind(this));
  },

  onChange(event) {
    //console.log(`Change: ${event.detail.value}`)
    this.data.music.setAttribute('volume', event.detail.value);

    this.el.sceneEl.emit("task-change-volume");
  }
});