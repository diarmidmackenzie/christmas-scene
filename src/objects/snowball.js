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

    this.playArea = document.getElementById("play-area");
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
    const radius = snowball.mixinEls[0].componentCache.geometry.radius;
    snowball.setAttribute('ammo-shape', `type:sphere; fit:manual; sphereRadius:${radius * this.data.scale}`)
    snowball.setAttribute('id', `snowball-${Math.random().toFixed(4)}`)
    snowball.setAttribute('networked', 'persistent: true; template:#object-template')
    snowball.object3D.scale.set(this.data.scale, this.data.scale, this.data.scale);
    this.el.object3D.getWorldPosition(snowball.object3D.position);
    snowball.setAttribute('snowball-grow-on-roll', "");
    this.playArea.appendChild(snowball);

    // See: https://github.com/networked-aframe/networked-aframe/blob/master/examples/persistent-peer-to-peer.html
    document.body.dispatchEvent(new CustomEvent('persistentEntityCreated', {detail: {el: snowball}}));

    this.el.sceneEl.emit("task-snowball")
  }
});

AFRAME.registerComponent('snowball-grow-on-roll', {

  schema: {
    // snowball center must be below radius + this height to grow.
    heightDelta: {type: 'number', default: 0.01},
    // Growth of radius per radius travelled.
    // This factor is added to "scale" for each radian of rotation.
    growthRate: {type: 'number', default: 0.01},

    // radius at which snowballs cease to be grabbable/stickable.
    // not working yet,
    //maxGrabbableRadius:  {type: 'number', default: 0.2},
  },

  init() {

    this.lastWorldPosition = new THREE.Vector3()
    this.lastWorldQuaternion = new THREE.Quaternion()
    this.el.object3D.getWorldPosition(this.lastWorldPosition);
    this.el.object3D.getWorldQuaternion(this.lastWorldQuaternion);

    this.geometryRadius = this.el.mixinEls[0].componentCache.geometry.radius;
    this.setRadius();

    // used in calculations
    this.currentWorldPosition = new THREE.Vector3()
    this.currentWorldQuaternion = new THREE.Quaternion()
    this.distanceMoved = new THREE.Vector3()
  },

  setRadius() {

    this.radius = this.geometryRadius * this.el.object3D.scale.x;
    this.maxHeight = this.radius + this.data.heightDelta;

    /*if (this.radius > this.data.maxGrabbableRadius) {
      this.el.setAttribute('movement', "type:dynamic; stickiness:none");
    }*/

    if (this.radius > 0.3) {
        this.el.sceneEl.emit("task-big-snowball");
    }
  },

  tick(time, timeDelta) {

    this.el.object3D.getWorldPosition(this.currentWorldPosition);
    this.el.object3D.getWorldQuaternion(this.currentWorldQuaternion);

    if (this.lastWorldPosition.y < this.maxHeight &&
        this.currentWorldPosition.y < this.maxHeight) {
      // snowball stayed below height limit.
      // grow it by horoizontal distance travelled.

      /* Distance-bsed - growth not using this */
      /*this.distanceMoved.subVectors(this.currentWorldPosition,
                                    this.lastWorldPosition);
      this.distanceMoved.y = 0;

      const distance = this.distanceMoved.length();*/

      const distance = this.lastWorldQuaternion.angleTo(this.currentWorldQuaternion);

      // require minium amount of turning speed before we grow.
      if (distance * 1000/timeDelta > 0.5) {

        const growthAmount = 0.1 * this.data.growthRate * distance / this.radius;

        const newScale = this.el.object3D.scale.x + growthAmount;
        this.el.object3D.scale.set(newScale, newScale, newScale);
        this.el.object3D.matrix.compose(this.el.object3D.position,
                                        this.el.object3D.quaternion,
                                        this.el.object3D.scale);

        this.setRadius()
      }
    }
    // update position for next tick.
    this.lastWorldPosition.copy(this.currentWorldPosition);
    this.lastWorldQuaternion.copy(this.currentWorldQuaternion);
  }
});
