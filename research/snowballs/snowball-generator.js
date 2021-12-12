AFRAME.registerComponent('snowball-generator', {

  schema: {
    // height level must go below to generate a snowball
    heightLevel: {type: 'number', default: 0.1},
    // how long must stay there with grip held down to generate a snowball.
    timer: {type: 'number', default: 1000},
    mixin: {type: 'string', default: 'snowball'},
    scale: {type: 'number', default: 0.15}

  },

  init() {

    this.timePassed = 0;
    this.el.addEventListener("gripdown", this.gripDown.bind(this));
    this.el.addEventListener("gripup", this.gripUp.bind(this));
  },


  tick(time, timeDelta) {

    // To create a snowball, certain conditions must be met continuously for
    // a set period of time.
    const emptyHand = (!this.el.components['hand'] ||
                       !this.el.components['hand'].grabbedEl);

    if (emptyHand &&
        this.el.object3D.position.y <= this.data.heightLevel &&
        this.gripIsDown) {

      this.timePassed += timeDelta;

      if (this.timePassed > this.data.timer) {
        this.createSnowball();
        // for our purposes, consider grip up
        // i.e. don't make any more snowballs until user
        // explicitly grips down again.
        this.gripIsDown = false;
      }
    }
    else {
      // conditions not met - reset timer to zero.
      this.timePassed = 0;
    }
  },

  gripDown() {
    this.gripIsDown = true;
  },

  gripUp() {
    this.gripIsDown = false;
  },

  createSnowball() {

    snowball = document.createElement('a-entity');
    snowball.setAttribute('mixin', this.data.mixin)
    snowball.setAttribute('movable-object', 'hull:false; initialState:dynamic')
    const radius = snowball.mixinEls[0].componentCache.geometry.radius;
    snowball.setAttribute('ammo-shape', `type:sphere; fit:manual; sphereRadius:${radius * this.data.scale}`)
    snowball.object3D.scale.set(this.data.scale, this.data.scale, this.data.scale);
    snowball.object3D.position.copy(this.el.object3D.position);
    this.el.sceneEl.appendChild(snowball);
  }
});
