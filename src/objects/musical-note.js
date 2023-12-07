AFRAME.registerComponent('musical-note', {
  schema: {
    note: {type: 'selector', default: '#xC'}
  },

  init() {
    // for collision detection, we need a static physics object.
    this.el.setAttribute('ammo-body', 'type: static; emitCollisionEvents: true');
    this.el.setAttribute('ammo-shape', 'type: hull');

    this.el.setAttribute('sound', {src: `#${this.data.note.id}`});

    // event listener to play on collide.
    // slight delay before setting up to avoid triggering collides on physics init.
    this.el.addEventListener('body-loaded', () => {
      setTimeout(() => {
        this.el.addEventListener('collidestart', this.onCollide.bind(this));
      }, 500)
    });
  },

  onCollide() {

    // we stop before playing, to allow for the same not to play twice
    // in a row, quickly.
    this.el.components['sound'].stopSound();
    this.el.components['sound'].playSound();

    this.el.sceneEl.emit("task-xylophone");
    this.el.sceneEl.emit("music-note", {note: this.data.note.id});
  }
});
