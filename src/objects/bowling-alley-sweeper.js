AFRAME.registerComponent('bowling-alley-sweeper', {

  init() {
    this.el.addEventListener("sweep", this.sweep.bind(this));
    this.el.addEventListener("resetPins", this.resetPins.bind(this));
  },

  sweep() {

    // raise it up.
    this.el.removeAttribute("animation__sweep");
    this.el.setAttribute("animation__sweep",
                         "property: position; to: 0 0.7 6.2; dur: 1000");

    // sweep
    setTimeout(() => {
      this.el.setAttribute("animation__sweep",
                           "property: position; to: 0 0.7 -6.2; dur: 4000");
    }, 1200);

    // put away
    setTimeout(() => {
      this.el.setAttribute("animation__sweep",
                           "property: position; to: 0 0 -6.2; dur: 1000");
    }, 5500);

    // bring back to start
    setTimeout(() => {
      this.el.setAttribute("position", "0 0 6.2");
    }, 7000);
  },

  resetPins() {
    penguins = document.querySelectorAll('[penguin]')

    penguins.forEach((el) => {
      el.emit("resetPin");
    })

    this.el.sceneEl.emit("task-reset-bowling");
  }
});
