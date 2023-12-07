AFRAME.registerComponent('bowling-alley-scoreboard', {

  init() {
    this.text = document.createElement('a-text');
    this.text.setAttribute('value', '');
    this.text.setAttribute('wrap-count', '7');
    this.text.setAttribute('color', 'blue');
    this.text.setAttribute('width', '5.0');
    this.text.setAttribute('align', 'center');

    this.el.appendChild(this.text);

    this.el.addEventListener("pin-down", this.pinDown.bind(this));

    this.lastPinCount = 0;
    this.pinCount = 0;
    this.countingFallenPins = false;

    this.sweeper = document.getElementById('bowling-alley-sweeper')

    this.sweeper.addEventListener("sweep", this.startSweep.bind(this));

  },

  startSweep() {
    // on sweep, we disable strike detection for ~15 seconds.
    this.sweeping = true;

    setTimeout(() => {
      this.sweeping = false;
    }, 15000);
  },

  pinDown() {

    if (this.sweeping) return;

    if (!this.countingFallenPins) {
      // First pin down, start counting...
      this.pinCount = 1;
      this.countingFallenPins = true;

      setTimeout(() => this.displayScore(), 2000)
    }
    else {
      this.pinCount += 1;
    }
  },

  displayScore() {

    var scoreText = "";
    this.countingFallenPins = false;

    if (this.pinCount >= 10) {
      scoreText = "STRIKE!"
      this.el.sceneEl.emit("task-strike-bowling");
    }

    this.text.setAttribute('value', scoreText);

    if (this.clearTimer) {
      // reset scoreboard clearing timer.
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = setTimeout(() => this.clearScore(), 10000)

    // save pin count for next time.
    this.lastPinCount = this.pinCount;
    this.pinCount = 0;
  },

  clearScore() {
    this.text.setAttribute('value', "");
  }

});
