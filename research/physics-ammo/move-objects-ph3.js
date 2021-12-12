
OBJECT_FIXED = 1;
OBJECT_HELD = 2;
OBJECT_LOOSE = 3;
TYPE_STATIC = 'static';

AFRAME.registerComponent('movement', {
  schema: {
    type: {type: 'string', default: 'grabbable', oneOf: ['static', 'grabbable']},
    stickiness: {type: 'string', default: 'stickable', oneOf: ['sticky', 'stickable', 'none']},
    gravity: {type: 'number', default: 9.8},
    initialState: {type: 'string', default: 'kinematic'}
  },

  init() {

    if (this.data.stickiness === 'sticky') {
      this.el.setAttribute('sticky')
    }

    if (this.data.stickiness === 'stickable') {
      this.el.setAttribute('stickable')
    }

    if (this.data.type === 'grabbable') {
      this.el.setAttribute('grabbable')
    }

    if (this.data.type === 'static') {
      // setup for static objects is very simple.
      this.el.setAttribute('ammo-body', 'type: static');
      this.el.setAttribute('ammo-body', 'emitCollisionEvents: true');
      return;
    }

    // set up for dynamic objects is more complex.

    // must start as dynamic of ever to become dynamic (Ammo.js bug).
    this.el.setAttribute('ammo-body', 'type: dynamic');
    this.el.setAttribute('ammo-body', 'emitCollisionEvents: true');
    this.el.setAttribute('ammo-body', `gravity: 0 ${-this.data.gravity} 0`);

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
    this.el.addEventListener("body-loaded", () => {
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
    });

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

    // matrices for working & for storing transform in relation to sticky parent.
    this.tempMatrix = new THREE.Matrix4();
    this.lockTransformMatrix = new THREE.Matrix4();

    // tick throttling for testing...
    this.tick = AFRAME.utils.throttleTick(this.tick, 200, this);
  },

  remove() {

    if (this.data.type !== 'static') {

      this.el.removeEventListener("collidestart", this.collideStart.bind(this));
      this.el.removeEventListener("collideend", this.collideEnd.bind(this));
      this.el.removeEventListener("grabbed", this.grabbed.bind(this));
      this.el.removeEventListener("released", this.released.bind(this));
    }
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

    if (this.shouldStickToTarget(targetEl)) {
      console.log(`add sticky Overlap with ${targetEl.id}`);
      this.stickyOverlaps.push(targetEl);
      console.log(`${this.stickyOverlaps.length} sticky overlaps in total`);

      if (this.state !== OBJECT_HELD) {
         console.log("not held, and collided with sticky object - add constraint.")

         this.setKinematic();
         this.attachToStickyParent(this.stickyOverlaps[0]);
      }
    }
  },

  attachToStickyParent(stickyParent) {

    // sets up thisl.lockTransformMatrix to represent the objects position
    // (which should now be fixed), from the perspective of the sticky parent.
    this.stickyParent = stickyParent;
    this.lockTransformMatrix.copy(this.el.object3D.matrixWorld);
    this.tempMatrix.copy(stickyParent.object3D.matrixWorld).invert();
    this.lockTransformMatrix.premultiply(this.tempMatrix)
  },

  detachFromStickyParent() {

    // sets up thisl.lockTransformMatrix to represent the objects position
    // (which should now be fixed), from the perspective of the sticky parent.
    this.stickyParent = null;
  },

  shouldStickToTarget(targetEl) {

    if (targetEl.hasAttribute('sticky')) return true;

    if (this.el.hasAttribute('sticky') &&
        targetEl.hasAttribute('stickable')) return true;

    return false;

  },

  collideEnd(event) {

    targetEl = event.detail.targetEl;
    console.log(`object ends collide with object ${targetEl.id}`)

    if (this.shouldStickToTarget(targetEl)) {
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

    if (this.stickyOverlaps.length > 0) {
      this.attachToStickyParent(this.stickyOverlaps[0]);
    }
    else {
      this.detachFromStickyParent(this.stickyOverlaps[0]);
    }
  },

  grabbed() {
    console.log("grabbed - release constraint to static object")

    this.setKinematic();
    this.state = OBJECT_HELD;
    console.log(this.el);
  },

  released() {
    if (this.stickyOverlaps.length > 0) {
      // overlaps with a static object.
      console.log("released - re-attach to static object")
      this.setKinematic();
      this.state = OBJECT_FIXED;
      this.attachToStickyParent(this.stickyOverlaps[0]);
    }
    else {
      // become a dynamic object.
      console.log("released - becomes loose dynamic object")
      this.setDynamic();
      this.state = OBJECT_LOOSE;
      this.detachFromStickyParent(this.stickyOverlaps[0]);
    }
  },

  tick(time, timeDelta) {

    if (this.data.type === 'static') return;

    // tie object to sticky parent (which may be moving).
    if (this.stickyParent) {

      const object = this.el.object3D;
      const tiedTo = this.stickyParent.object3D;

      // race condition can occur in object switchover.
      if (!object.parent) return;
      if (!tiedTo.parent) return;

      // tempMatrix will translate a world matrix into object's parent's space.
      // (the object's DOM parent, not the sticky parent it is tied to)
      this.tempMatrix.copy(object.parent.matrixWorld).invert();

      // object should stay fixed at this.lockTransformMatrix.
      object.matrix.copy(this.lockTransformMatrix);
      // express this in world co-ordinates...
      object.matrix.premultiply(tiedTo.matrixWorld);
      // ... and now in the object's parents's co-ordinates.
      object.matrix.premultiply(this.tempMatrix);

      // apply matrix to object.
      object.matrix.decompose(object.position, object.quaternion, object.scale);
      object.matrixWorldNeedsUpdate = true;
    }

    // Track velocity state, in case the object gets released to dynamic physics
    // - in that case we want to initialze velocity
    if (this.state !== OBJECT_LOOSE) {
      this.lastPositions[this.historyPointer].copy(this.el.object3D.position);
      this.lastQuaternions[this.historyPointer].copy(this.el.object3D.quaternion);
      this.lastTimeDeltas[this.historyPointer] = timeDelta;
      this.historyPointer = 1 - this.historyPointer;
      this.physicsStarting = true;
    }
    else {
      if (this.physicsStarting) {
        // In thr first frame after becoming a loose object, we calculate prior velocity & apply it to
        // the object...

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

        if (Ammo.asm.$) {
          // convert velocity to world co-ordinates.
          this.velocity.applyMatrix4(this.el.object3D.parent.matrixWorld);

          const ammoVelocity = new Ammo.btVector3(0, 0, 0);
          ammoVelocity.x = this.velocity.x;
          ammoVelocity.y = this.velocity.y;
          ammoVelocity.z = this.velocity.z;
          console.log("Initial ammo velocity on release:")
          console.log(ammoVelocity)
          this.el.body.setLinearVelocity(ammoVelocity);
          Ammo.destroy(ammoVelocity);
        }

        /* Old code for rotation - we don't seem to need this...
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
        */

        // let the physics engine take it from here...
        this.physicsStarting = false;
      }
    }
  }
});

// Add to a controller, to allow it to manipulate grabbable objects
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
    // 500 msecs should be plenty.
    this.collider.setAttribute('ammo-body', 'disableCollision: true');
    setTimeout(() => {
      this.collider.setAttribute('ammo-body', 'disableCollision: false')
    }, 500);

    if (this.grabbedEl) {
      console.log("release object on grip up")
      this.releaseObject(this.grabbedEl);
    }
  },

  // track collisions with movable objects.
  collideStart(event) {
    targetEl = event.detail.targetEl;
    console.log(`controller collides with object ${targetEl.id}`)
    if (targetEl.hasAttribute('grabbable')) {
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
    if (targetEl.hasAttribute('grabbable')) {
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
    el.emit("grabbed")
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

  tick() {

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
