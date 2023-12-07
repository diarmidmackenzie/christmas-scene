AFRAME.registerComponent('camera-event-watcher', {

  init() {
    this.defaultYAxis = new THREE.Vector3(0, 1, 0);
    this.camDir = new THREE.Vector3();
    this.camQ = new THREE.Quaternion();

    this.snowflakeTime = 0;
    this.snowAngelTime = 0;

    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);
  },

  tick(t, dt) {

    var cam = this.el.object3D;
    cam.updateMatrixWorld();
    this.camQ.setFromRotationMatrix(cam.matrixWorld);
    this.camDir.set(0, 0, -1);
    this.camDir.applyQuaternion(this.camQ);

    if (this.camDir.angleTo(this.defaultYAxis) < 0.5) {
      // looking straight up.
      this.snowflakeTime += dt;
    }
    else {
      this.snowflakeTime = 0;
    }

    if (this.el.object3D.position.y < 0.3) {
      // lying on floor - snow angel.
      this.snowAngelTime += dt;
    }
    else {
      this.snowAngelTime = 0;
    }

    if (this.snowAngelTime > 3000) {
      this.el.sceneEl.emit("task-snow-angel");
    }

    if (this.snowflakeTime > 3000) {
      this.el.sceneEl.emit("task-catch-snowflake");
    }
  }
});


AFRAME.registerComponent('detect-bauble', {

  init() {
    this.el.addEventListener('collidestart', this.onCollide.bind(this));
  },

  onCollide(event) {

    if (event.detail.targetEl.hasAttribute('bauble')) {
      this.el.sceneEl.emit("task-marble-run")
    }
  }

});

AFRAME.registerComponent('bauble', {

  init() {

    this.worldPosition = new THREE.Vector3();
    this.distanceToCamera = new THREE.Vector3();
    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);
  },

  tick() {

     this.el.object3D.getWorldPosition(this.worldPosition);
     var cam = this.el.sceneEl.camera.el.object3D;
     cam.updateMatrixWorld();
     this.distanceToCamera.setFromMatrixPosition(cam.matrixWorld);
     this.distanceToCamera.sub(this.worldPosition);

     if (this.distanceToCamera.lengthSq() < 0.1) {
       // approx 30cm from camera.
       this.el.sceneEl.emit("task-close-look");
     }
  }

});

AFRAME.registerComponent('count-painted-snowballs', {

  init() {
    this.snowballsPainted = 0;
    this.el.sceneEl.addEventListener("snowball-painted", this.snowballPainted.bind(this));
    this.el.sceneEl.addEventListener("icicle-painted", this.iciclePainted.bind(this));
  },

  snowballPainted() {

    this.snowballsPainted++;

    if (this.snowballsPainted === 5) {
      this.el.sceneEl.emit("task-paint-snowballs");
    }
  },

  iciclePainted() {

    const icicles = document.querySelectorAll('[musical-note]');

    const colors = [];

    icicles.forEach((el) => {
      const color = el.getAttribute("material").color;

      if (!colors.includes(color)) {
        colors.push(color);
      }
    })

    if (colors.length >= 8) {
      this.el.sceneEl.emit("task-paint-icicles");
    }
  }
});

AFRAME.registerComponent('carrot-watch', {

  init() {
    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);

    this.worldScale = new THREE.Vector3();
  },

  tick() {

     this.el.object3D.getWorldScale(this.worldScale);
     if (this.worldScale.x > 3) {
       // carrot grew to 3 foot!
       this.el.sceneEl.emit("task-large-carrot")
       this.el.removeAttribute('carrot-watch')
     }
  }

});

AFRAME.registerComponent('tune-detector', {

  init() {
    this.tune = [
      "xC",
      "xF",
      "xF",
      "xG",
      "xF",
      "xE",
      "xD",
      "xD"
    ]

    this.el.sceneEl.addEventListener("music-note", this.hearNote.bind(this));
    this.sequenceNumber = 0;
  },

  hearNote(event) {

    note = event.detail.note;
    if (note === this.tune[this.sequenceNumber]) {

      this.sequenceNumber++;
      if (this.sequenceNumber >= this.tune.length) {
        this.el.sceneEl.emit("task-merry-christmas")
      };
    }
    else {
      // out of sequence.  But maybe 1st note of new sequence.
      if (note === this.tune[0]) {
        this.sequenceNumber = 1;
      }
      else {
        this.sequenceNumber = 0;
      }
    }
  }

});

AFRAME.registerComponent('check-for-present-stack', {

  init() {
    this.presents = document.querySelectorAll('[present]')

    this.tick = AFRAME.utils.throttleTick(this.tick, 500, this);
  },

  tick() {

    var stackCount = 0;

    // look for a & b stacked over each other.
    this.presents.forEach((a) => {

      this.presents.forEach((b) => {
        if (this.presentsStacked(a,b)) {
          stackCount += 1;
        }
      });
    });

    // A stack of 3 presents a, b, c will give us 3 stacked relationships:
    // b over a, c over b & c over a.

    if (stackCount >= 3) {

      this.el.sceneEl.emit("task-stack-presents");
      this.el.removeAttribute("check-for-present-stack");
    }
  },

  presentsStacked(a, b) {
    var top;
    var bottom;

    if (!a.object3D) return;
    if (!b.object3D) return;

    if (a.object3D.position.y > b.object3D.position.y) {
      top = a;
      bottom = b;
    }
    else {
      // not stacked this way round (a over b).
      return;
    }

    const yOffset = top.object3D.position.y - bottom.object3D.position.y;

    // smallest presents are height 0.1
    if (yOffset < 0.09) {
      return false;
    }
    const xOffset = Math.abs(top.object3D.position.x - bottom.object3D.position.x);
    const zOffset = Math.abs(top.object3D.position.z - bottom.object3D.position.z);

    // approximate stacking check.  boxes are roughly cubes, so this is a decent
    // (simple) way of judging whether they are stacked vs. side-by-side.
    if (xOffset < yOffset && zOffset < yOffset) {
      return true;
    }
    else {
      return false;
    }
  }
});
