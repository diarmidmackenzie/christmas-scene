AFRAME.registerComponent('sticky-object', {

  init() {
     this.el.setAttribute('ammo-body', 'type: static');
     this.el.setAttribute('ammo-shape', 'type: hull');
  }

});

OBJECT_FIXED = 1;
OBJECT_HELD = 2;
OBJECT_LOOSE = 3;
TYPE_STATIC = 'static';

AFRAME.registerComponent('movable-object', {
  schema: {
    gravity: {type: 'number', default: 9.8},
    hull: {type: 'boolean', default: true},
    initialState: {type: 'string', default: 'kinematic'},
    // how long we run "homegrown" (gravity-only physics, before switching on full collision physics)
    // 150 msecs is enough to fall 11cm, which shuld be enough to clear the hand collider sphere (5cm radius).
    releaseTimer: {type: 'number', default: 150}
  },

  init() {
    // must start as dynamic of ever to become dynamic (Ammo.js bug).
    // for case where object is spawned after physics initialized, these must both be set on the same call.
    this.el.setAttribute('ammo-body', 'type: dynamic;emitCollisionEvents: true');
    this.el.setAttribute('ammo-body', `gravity: 0 ${-this.data.gravity} 0`);

    if (this.data.hull) {
      // if not hull, must be specified externally.
      this.el.setAttribute('ammo-shape', 'type: hull');
    }

    // set to invisible until fully initialized, so we don't see weird effects
    // of being temporarily dynamic.
    this.visible = this.el.object3D.visible;
    this.el.object3D.visible = false;

    this.position = new THREE.Vector3();
    this.position.copy(this.el.object3D.position)

    // Basic logic of this element:
    // When held, kinematic, move anywhere.
    // When released
    // - if in contact with a static object, stay kinematic.
    // - else become dynamic
    this.el.addEventListener("collidestart", this.collideStart.bind(this));
    this.el.addEventListener("collideend", this.collideEnd.bind(this));
    this.el.addEventListener("grabbed", this.grabbed.bind(this));
    this.el.addEventListener("released", this.released.bind(this));

   // Workaround for Ammo.js issues with switching from dynamic to kinematic & vice-versa.
    if (this.el.components['ammo-body'].body) {
      this.initOnceBodyLoaded();
    }
    else {
      this.el.addEventListener("body-loaded", () => {
        this.initOnceBodyLoaded();
      });
    }

    this.state = OBJECT_FIXED;
    this.stickyOverlaps = [];

    this.lastPositions = [new THREE.Vector3(),
                          new THREE.Vector3()];
    this.lastQuaternions = [new THREE.Quaternion(),
                            new THREE.Quaternion()];
    this.lastTimeDeltas = [0, 0];
    this.historyPointer = 0;

    this.velocity = new THREE.Vector3();
    this.velocityDelta = new THREE.Vector3();
    this.tempQuaternion = new THREE.Quaternion();
    this.rotationAxis = new THREE.Vector3();
    this.rotationSpeed = 0;
  },

  initOnceBodyLoaded() {
    setTimeout(() => {
      this.el.setAttribute('ammo-body', 'type:kinematic');
      this.el.setAttribute('ammo-body', 'type:dynamic');
      this.el.setAttribute('ammo-body', {type : this.data.initialState});

      // reset position if kinematic.
      if (this.data.initialState === 'kinematic') {
        this.el.object3D.position.copy(this.position)
      }
      // and make visible again (if appropriate).
      this.el.object3D.visible = this.visible;
    }, 1);
  },

  remove() {
    this.el.removeEventListener("collidestart", this.collideStart.bind(this));
    this.el.removeEventListener("collideend", this.collideEnd.bind(this));
    this.el.removeEventListener("grabbed", this.grabbed.bind(this));
    this.el.removeEventListener("released", this.released.bind(this));
  },

  setKinematic() {
    // set object to kinematic.
    console.log("set to kinematic")
    this.el.setAttribute('ammo-body', 'type: kinematic');

  },

  setDynamic() {
    // set object to dynamic.
    console.log("set to dynamic")
    this.el.setAttribute('ammo-body', 'type: dynamic');

    // set initial velocity & rotation based on prior movement.
    // To Do...

  },

  // collideStart & collideEnd used to track overlaps with static objects, to
  // correctly handle release.
  collideStart(event) {

    targetEl = event.detail.targetEl;
    console.log(`object starts collide with object ${targetEl.id}`)

    if (targetEl.hasAttribute('sticky-object')) {
      console.log(`add sticky Overlap with ${targetEl.id}`);
      this.stickyOverlaps.push(targetEl);
      console.log(`${this.stickyOverlaps.length} sticky overlaps in total`);

      if (this.state !== OBJECT_HELD) {
         console.log("not held, and collided with sticky object - add constraint.")
         //this.el.setAttribute('ammo-constraint__static', `target:#${targetEl.id}`);
         this.setKinematic();
      }
    }
  },

  collideEnd(event) {

    targetEl = event.detail.targetEl;
    console.log(`object ends collide with object ${targetEl.id}`)

    if (targetEl.hasAttribute('sticky-object')) {
      const index = this.stickyOverlaps.indexOf(targetEl)

      if (index > -1) {
        console.log(`remove sticky Overlap with ${targetEl.id}`);
        this.stickyOverlaps.splice(index, 1);
        console.log(`${this.stickyOverlaps.length} sticky overlaps in total`);
      }
      else {
        comsole.warn("Unexpected - collideEnd doesn't match element");
        console.log(`${this.stickyOverlaps} sticky overlaps in total`);
      }
    }
  },

  grabbed(event) {
    console.log("grabbed - release constraint to static object")
    //this.el.removeAttribute('ammo-constraint__static');
    //this.setDynamic(); // dynamic needed for constraint to work.
    this.setKinematic(); // using parenting instead of constraints.
    this.state = OBJECT_HELD;
    console.log(this.el);
    //this.stickyOverlaps = [];

    this.hand = event.detail.hand;
  },

  released() {
    if (this.stickyOverlaps.length > 0) {
      // overlaps with a static object.
      console.log("released - re-attach to static object")
      this.setKinematic();
      //this.el.setAttribute('ammo-constraint__static', `target:#${this.stickyOverlaps[0].id}`);
      this.state = OBJECT_FIXED;
    }
    else {
      // become a dynamic object.
      console.log("released - becomes loose dynamic object")

      this.state = OBJECT_LOOSE;

/*
      if (Ammo.asm.$) {
        // set velocity based on current hand velocity
        this.hand.components['hand'].getHandVelocity(this.velocity);
        this.velocity.applyMatrix4(this.hand.object3D.parent.matrixWorld);

        const ammoVelocity = new Ammo.btVector3(0, 0, 0);
        ammoVelocity.setX(5)//this.velocity.x);
        ammoVelocity.setY(this.velocity.y);
        ammoVelocity.setZ(this.velocity.z);
        console.log("Initial ammo velocity on release:")
        console.log(`x: ${ammoVelocity.x()}`)
        console.log(`y: ${ammoVelocity.y()}`)
        console.log(`z: ${ammoVelocity.z()}`)

        this.el.body.setLinearVelocity(ammoVelocity);
        Ammo.destroy(ammoVelocity);
        /*setTimeout(() => {
          this.el.body.setLinearVelocity(ammoVelocity);
          Ammo.destroy(ammoVelocity);
        }, 100)*/

        // We run "homemade" physics for a short period, before Ammo dynamic physics
        // take over.
        // This is because with Ammo dynamic physics, we don't have a way of
        // preventing the hand collider from interfering with the object path.
        // Tried disabling collisions & setting masks, but none of this is
        // proving effective.
        // Not yet had time to create a proper clean repro & file a bug.
        this.runHomemadePhysics = true;
        setTimeout(() => {
          this.setDynamic();
          this.runHomemadePhysics = false;
        }, this.data.releaseTimer)
      }

    this.hand = null;
  },

  tick(time, timeDelta) {

    if (this.state === OBJECT_HELD) {
      this.lastPositions[this.historyPointer].copy(this.el.object3D.position);
      this.lastQuaternions[this.historyPointer].copy(this.el.object3D.quaternion);
      this.lastTimeDeltas[this.historyPointer] = timeDelta;
      this.historyPointer = 1 - this.historyPointer;
      this.physicsStarting = true;
    }
    else {
      if (this.physicsStarting) {
        // we extract the velocity from the last 2 frames.
        // historyPointer always indicates the older time interval.
        // for TimeDelta, we take the other slot, which tells us the elapsed time *after* that
        // measurement to the newer measurement.
        this.velocity.subVectors(this.el.object3D.position, this.lastPositions[this.historyPointer]);
        // For reasons I don't yet understand, boosting velocity by a factor of 2
        // makes it feel much more realistic.
        this.velocity.multiplyScalar(2000 / (timeDelta + this.lastTimeDeltas[1 - this.historyPointer]));
        console.log("initial velocity:");
        console.log(this.velocity);

        // Similar exercise with rotation, which we store as an axis/angle,
        // for easy scalar multiplication.
        // Getting rotation axis from Quaternion is simply a matter of normalizing the (x, y, z)
        // components, interpreted as a vector.
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm
        this.lastQuaternions[this.historyPointer]
        this.el.object3D.quaternion
        this.tempQuaternion.copy(this.lastQuaternions[this.historyPointer]).invert();
        this.tempQuaternion.multiply(this.el.object3D.quaternion)

        this.rotationAxis.set(this.tempQuaternion.x,
                              this.tempQuaternion.y,
                              this.tempQuaternion.z).normalize();
        const rotationAngle = this.lastQuaternions[this.historyPointer].angleTo(this.el.object3D.quaternion);
        this.rotationSpeed = rotationAngle * (2000 / (timeDelta + this.lastTimeDeltas[1 - this.historyPointer]));

        this.physicsStarting = false;
      }

      if (this.runHomemadePhysics) {
        this.velocity.y -= this.data.gravity * timeDelta / 1000;
        this.velocityDelta.copy(this.velocity);
        this.velocityDelta.multiplyScalar(timeDelta / 1000);
        this.el.object3D.position.add(this.velocityDelta);

        // apply rotation.
        const angle = this.rotationSpeed * timeDelta / 1000;
        this.tempQuaternion.setFromAxisAngle(this.rotationAxis, angle);
        this.el.object3D.quaternion.multiply(this.tempQuaternion);
      }
    }
  }
});

// Add to a controller, to allow it to manipulate movable-objects
AFRAME.registerComponent('hand', {
  init() {
    this.collider = document.createElement('a-sphere');
    this.collider.setAttribute('id', `${this.el.id}-collider`);
    this.collider.setAttribute('radius', 0.05);
    this.collider.setAttribute('visible', false);
    this.collider.setAttribute('ammo-body', 'type: kinematic');
    this.collider.setAttribute('ammo-body', 'emitCollisionEvents: true');
    this.collider.setAttribute('ammo-shape', 'type: sphere');
    this.el.appendChild(this.collider)

    this.el.addEventListener("gripdown", this.gripDown.bind(this));
    this.el.addEventListener("gripup", this.gripUp.bind(this));
    this.el.addEventListener("collidestart", this.collideStart.bind(this));
    this.el.addEventListener("collideend", this.collideEnd.bind(this));

    this.collisions = [];
    this.grabbedEl = null;
    this.gripDown = false;
    this.savedParent = null;

    this.tempMatrix = new THREE.Matrix4();

    this.lockTransformMatrix = new THREE.Matrix4();
    this.newMatrix = new THREE.Matrix4();

    // data used for velocity tracking of the hand.
    this.lastPositions = [new THREE.Vector3(),
                          new THREE.Vector3()];
    this.lastQuaternions = [new THREE.Quaternion(),
                            new THREE.Quaternion()];
    this.lastTimeDeltas = [0, 0];
    this.historyPointer = 0;

    this.velocity = new THREE.Vector3();
    this.velocityDelta = new THREE.Vector3();
    this.tempQuaternion = new THREE.Quaternion();
    this.rotationAxis = new THREE.Vector3();
    this.rotationSpeed = 0;
  },

  gripDown() {

    this.gripDown = true;
    // collider should be set already, but set it again to be sure.
    this.collider.setAttribute('ammo-body', 'disableCollision: false');

    if (this.collisions.length > 0) {
      console.log("grab object on grip down")
      this.grabObject(this.collisions[0]);
    }
  },

  gripUp() {

    this.gripDown = false;
    // remove collisions, so we don't apply weird forces to objects as we release them.
    // !! seems this is not working... dynamic body is still being influenced by kinematic body..
    // Maybe doesn't act quickly enough?
    // Not sure...
    this.collider.setAttribute('ammo-body', 'disableCollision: true');

    // actually, it's a nicer UX to have no collisions on grip up...
    //setTimeout(() => {
    //  this.collider.setAttribute('ammo-body', 'disableCollision: false')
    //}, 500);

    if (this.grabbedEl) {
      console.log("release object on grip up")
      this.releaseObject(this.grabbedEl);
    }
  },

  // track collisions with movable objects.
  collideStart(event) {
    targetEl = event.detail.targetEl;
    console.log(`controller collides with object ${targetEl.id}`)
    if (targetEl.hasAttribute('movable-object')) {
      this.collisions.push(targetEl);

      if (this.gripDown &&
          !this.grabbedEl) {
        console.log("grab object - grip already down")
        this.grabObject(targetEl)
      }
    }
  },

  collideEnd(event) {
    targetEl = event.detail.targetEl;
    console.log(`controller ends collide with object ${targetEl.id}`)
    if (targetEl.hasAttribute('movable-object')) {
      const index = this.collisions.indexOf(targetEl)

      if (index > -1) {
        this.collisions.splice(index, 1);
      }
      else {
        console.log("`Unexpected - collideEnd doesn't match element");
        console.log(targetEl);
      }

      // weird case where other forces on object (e.g. manual policing of floor)
      // mean it pops out of our hand.
      // !! Not seeing a need for this yet...
      /*if (this.grabbedEl === targetEl) {
        this.releaseObject(this.grabbedEl);
      }*/
    }
  },

  grabObject(el) {

    this.setConstraint(el, this.collider);
    this.grabbedEl = el;
    // signal to element it has been grabbed.
    el.emit("grabbed", {hand: this.el})
  },

  releaseObject(el) {

    this.removeConstraint(el);
    this.grabbedEl = null;

    // signal to element it has been released.
    el.emit("released")

  },
  // Could be useful in future for handling dynamic objects.
/*
  setConstraint(fromEl, toEl) {

    console.log("set held constraint")
    fromEl.setAttribute('ammo-constraint__held', `target:#${toEl.id}`);
    console.log(fromEl);
  },

  removeConstraint(fromEl) {

    console.log("remove held constraint")
    fromEl.removeAttribute('ammo-constraint__held');
    console.log(fromEl);
  },
*/

  setConstraint(fromEl, toEl) {

    // fix the transform of fromEl in toEl's world space.
    this.lockTransformMatrix.copy(fromEl.object3D.matrixWorld);
    this.tempMatrix.copy(toEl.object3D.matrixWorld).invert();
    this.lockTransformMatrix.premultiply(this.tempMatrix)

    // lockTransform represents fromEl's current position in toEl's world space.
    // we keep this fixed - see tick() function.
    this.lockedObject = fromEl.object3D;
    this.lockedToObject = toEl.object3D;
  },

  removeConstraint(fromEl) {

    this.lockedObject = null;
    this.lockedToObject = null;

  },

  tick(time, timeDelta) {

    //if (this.awaitingNewElement) return;

    if (this.lockedObject) {
      // locked Object position should be set to lockTransformMatrix, in lockedToObject's space.
      // but we need to represent this in its parent's space.
      const object = this.lockedObject;

      // race condition cann occur in object switchover.
      if (!object.parent) return;

      this.tempMatrix.copy(object.parent.matrixWorld).invert();
      // tempMatrix will translate a world matrix into lockedObject's parent's space.

      this.lockedObject.matrix.copy(this.lockTransformMatrix);
      this.lockedObject.matrix.premultiply(this.lockedToObject.matrixWorld);
      this.lockedObject.matrix.premultiply(this.tempMatrix);

      object.matrix.decompose(object.position, object.quaternion, object.scale);
      object.matrixWorldNeedsUpdate = true;
    }

    // state tracking so we know the velocity of the hand.
    // reported on getHandVelocity();
    this.lastPositions[this.historyPointer].copy(this.el.object3D.position);
    this.lastQuaternions[this.historyPointer].copy(this.el.object3D.quaternion);
    this.lastTimeDeltas[this.historyPointer] = timeDelta;
    this.historyPointer = 1 - this.historyPointer;

  },

  // get Hand velocity - should be called with a Vector3 as a parameter.
  getHandVelocity(velocity) {

    // we extract the velocity from the last 2 frames.
    // historyPointer always indicates the older time interval.
    // for TimeDelta, we take the other slot, which tells us the elapsed time *after* that
    // measurement to the newer measurement.
    velocity.subVectors(this.lastPositions[1 - this.historyPointer], this.lastPositions[this.historyPointer]);

    velocity.multiplyScalar(1000 / (this.lastTimeDeltas[1 - this.historyPointer]));
    console.log("velocity:");
    console.log(velocity);
  }

});

AFRAME.registerComponent('hand-keyboard-controls', {

  init() {
    this.gripDown = false;
    this.el.addEventListener('up', () => this.el.object3D.position.y += 0.01)
    this.el.addEventListener('down', () => this.el.object3D.position.y -= 0.01)
    this.el.addEventListener('left', () => this.el.object3D.position.x -= 0.01)
    this.el.addEventListener('right', () => this.el.object3D.position.x += 0.01)
    this.el.addEventListener('turnCW', () => this.el.object3D.rotation.z -= 0.01)
    this.el.addEventListener('turnCCW', () => this.el.object3D.rotation.z += 0.01)
    this.el.addEventListener('togglegrip', () => {
      if (!this.gripDown) {
        this.gripDown = true;
        this.el.emit("gripdown");
        this.el.setAttribute('color','pink');
      }
      else {
        this.gripDown = false;
        this.el.emit("gripup");
        this.el.setAttribute('color','red');
      }
    });
  }
});
