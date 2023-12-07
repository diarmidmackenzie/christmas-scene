AFRAME.registerComponent('bowling-alley-reset', {

  init() {
    this.el.addEventListener('pressed', this.buttonPressed.bind(this));

    this.sweeper = document.getElementById('bowling-alley-sweeper')

  },

  buttonPressed() {

    this.sweeper.emit("sweep");
    // this.sweeper.emit("resetPins"); // to do at same time...

    setTimeout(() => {
      this.sweeper.emit("resetPins")
    }, 7000); // to do in sequence (more fun cos penguins go flying? :-)
  }
});
