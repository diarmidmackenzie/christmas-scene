OBJECT_FIXED = 1;
OBJECT_HELD = 2;
OBJECT_LOOSE = 3;
TYPE_STATIC = 'static';

const GLOBAL_DATA = {
  tempMatrix: new THREE.Matrix4(),
  tempQuaternion: new THREE.Quaternion(),
}

const GLOBAL_FUNCS = {
  reparent : function (object, oldParent, newParent) {

  if (object.parent === newParent) {
    return;
  }

  console.log(`Reparenting ${object.el.id} from ${oldParent.el ? oldParent.el.id : "unknown"} to ${newParent.el ? newParent.el.id : "unknown"}`);

  oldParent.updateMatrixWorld();
  oldParent.updateMatrix();
  object.updateMatrix();
  newParent.updateMatrixWorld();
  newParent.updateMatrix();

  GLOBAL_DATA.tempMatrix.copy(newParent.matrixWorld).invert();
  object.matrix.premultiply(oldParent.matrixWorld);
  object.matrix.premultiply(GLOBAL_DATA.tempMatrix);
  object.matrix.decompose(object.position, object.quaternion, object.scale);
  object.matrixWorldNeedsUpdate = true;
  newParent.add(object);
},
};

AFRAME.registerComponent('movement', {
  schema: {
    type: {type: 'string', default: 'grabbable', oneOf: ['static', 'grabbable', 'dynamic']},
    stickiness: {type: 'string', default: 'stickable', oneOf: ['sticky', 'stickable', 'sticky2', 'stickable2', 'none']},
    gravity: {type: 'number', default: 9.8},
    initialState: {type: 'string', default: 'kinematic'},
    // how long we run "homegrown" (gravity-only physics, before switching on full collision physics)
    // 150 msecs is enough to fall 11cm, which shuld be enough to clear the hand collider sphere (5cm radius).
    releaseTimer: {type: 'number', default: 150}
  },

  init() {

    if (this.data.type === 'static') {
      // setup for static objects is very simple.
      this.el.setAttribute('ammo-body', 'type: static');
      this.el.setAttribute('ammo-body', 'emitCollisionEvents: true');
      return;
    }

    // set up for dynamic objects is more complex.

    // must start as dynamic of ever to become dynamic (Ammo.js bug).

    // for case where object is spawned after physics initialized, these must both be set on the same call.
    this.el.setAttribute('ammo-body', 'type: dynamic;emitCollisionEvents: true');
    this.el.setAttribute('ammo-body', `gravity: 0 ${-this.data.gravity} 0`);

    // set to invisible until fully initialized, so we don't see weird effects
    // of being temporarily dynamic.
    this.visible = this.el.object3D.visible;
    this.el.object3D.visible = false;

    // Save off world position, so we can undo any dynamic movement that happens
    // while initializing objects (even kinetic objects are initially created as dynamic).

    this.worldPosition = new THREE.Vector3();
    this.worldQuaternion = new THREE.Quaternion();
    if (this.el.sceneEl.hasLoaded) {
      this.el.object3D.parent.updateMatrixWorld();
      this.el.object3D.getWorldPosition(this.worldPosition);
      this.el.object3D.getWorldQuaternion(this.worldQuaternion);
      this.playArea = document.getElementById("play-area");
    }
    else {
      this.el.sceneEl.addEventListener('loaded', () => {
        this.el.object3D.parent.updateMatrixWorld();
        this.el.object3D.getWorldPosition(this.worldPosition);
        this.el.object3D.getWorldQuaternion(this.worldQuaternion);
        this.playArea = document.getElementById("play-area");
      });
    }


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

    // matrices for working & for storing transform in relation to sticky parent.
    this.tempMatrix = new THREE.Matrix4();
    this.lockTransformMatrix = new THREE.Matrix4();

    this.throwaway = new THREE.Vector3();
  },

  update() {
    if (this.data.stickiness === 'sticky') {
      this.el.setAttribute('sticky')
    }
    else {
      this.el.removeAttribute('sticky')
      this.stickyOverlaps = [];
    }

    if (this.data.stickiness === 'sticky2') {
      this.el.setAttribute('sticky2')
    }
    else {
      this.el.removeAttribute('sticky2')
      this.stickyOverlaps = [];
    }

    if (this.data.stickiness === 'stickable') {
      this.el.setAttribute('stickable')
    }
    else {
      this.el.removeAttribute('stickable')
      this.stickyOverlaps = [];
    }

    if (this.data.stickiness === 'stickable2') {
      this.el.setAttribute('stickable2')
    }
    else {
      this.el.removeAttribute('stickable2')
      this.stickyOverlaps = [];
    }

    if (this.data.type === 'grabbable') {
      this.el.setAttribute('grabbable')
    }
    else {
      this.el.removeAttribute('grabbable')
    }
  },


  initOnceBodyLoaded() {
    setTimeout(() => {
      this.el.setAttribute('ammo-body', 'type:kinematic');
      this.el.setAttribute('ammo-body', 'type:dynamic');
      this.el.setAttribute('ammo-body', {type : this.data.initialState});

      // reset position to saved world position if kinematic.
      if (this.data.initialState === 'kinematic') {

        this.setWorldPosition(this.el.object3D, this.worldPosition);
        this.setWorldQuaternion(this.el.object3D, this.worldQuaternion);
      }
      // and make visible again (if appropriate).
      this.el.object3D.visible = this.visible;
    }, 1);
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

    // re-instate collisions on descandants that may have been disabled.
    // use a timer to avoid race conditions around dynamic->kinematic switch.
    setTimeout(() => this.enableCollisionOnDescendants(this.el.object3D), 100);

  },

  setDynamic() {

    // first check for any children that are colliding with this element.
    // disable collisions for them - else they will exert forces on this
    // body when it becomes dynamic, resulting in crazy runaway acceleration
    // (since they are fixed to this object!)
    this.suppressCollisionsOnOverlappingDescendants(this.el.object3D);
    // set object to dynamic.
    console.log("set to dynamic")
    this.el.setAttribute('ammo-body', 'type: dynamic');

  },

  enableCollisionOnDescendants(object) {

    if ((object.el) &&
        (object.el.hasAttribute('ammo-body')))  {
          object.el.setAttribute('ammo-body', 'disableCollision:false');
        }

    object.children.forEach((o) => {
      this.enableCollisionOnDescendants(o)
    });

  },

  suppressCollisionsOnOverlappingDescendants(object) {

    if (object.el &&
        object.el !== this.el &&
        this.stickyOverlaps.includes(object.el)) {
          object.el.setAttribute('ammo-body', 'disableCollision:true');
        }

    object.children.forEach((o) => {
      this.suppressCollisionsOnOverlappingDescendants(o)
    });
  },

  // collideStart & collideEnd used to track overlaps with static objects, to
  // correctly handle release.
  collideStart(event) {

    targetEl = event.detail.targetEl;

    if (targetEl === this.el) {
      console.log(`Ignore collision with self on ${targetEl.id}`)
      return;
    }

    console.log(`${this.el.id} object starts collide with object ${targetEl.id}`)

    if (this.shouldStickToTarget(targetEl)) {
      console.log(`add sticky Overlap with ${targetEl.id}`);

      // add to stickyOverlaps, but avoid duplicates.
      if (!this.stickyOverlaps.includes(targetEl)) {
        this.stickyOverlaps.push(targetEl);
      }

      console.log(`${this.stickyOverlaps.length} sticky overlaps in total`);

      if (this.state === OBJECT_LOOSE) {
         console.log("Loose, and collided with sticky object - add constraint.")

         const toStickTo = this.nonChildStickyOverlap()

         if (toStickTo) {
           this.setKinematic();
           this.attachToStickyParent(toStickTo);
         }
      }
    }
  },

  attachToStickyParent(stickyParent) {

    if (!this.originalParent) {
      this.originalParent = this.el.object3D.parent;
    }

    // Never reparent to our own child (causes infinite stack errors!)
    if (this.isMyDescendent(stickyParent.object3D)) return;

    GLOBAL_FUNCS.reparent(this.el.object3D,
                          this.el.object3D.parent,
                          stickyParent.object3D);

  },

  isMyDescendent(object) {
    if (!object.parent) return false;
    if (object.parent === this.el.object3D) return true;

    return (this.isMyDescendent(object.parent));
  },

  detachFromStickyParent() {

    var newParent = this.originalParent ? this.originalParent : this.playArea.object3D;

    GLOBAL_FUNCS.reparent(this.el.object3D,
                          this.el.object3D.parent,
                          newParent);

    this.originalParent = null;

  },

  shouldStickToTarget(targetEl) {

    if (this.el.hasAttribute('stickable') &&
        targetEl.hasAttribute('sticky')) return true;

    if (this.el.hasAttribute('sticky') &&
        (targetEl.hasAttribute('stickable') ||
         targetEl.hasAttribute('sticky'))) return true;

    if (this.el.hasAttribute('stickable2') &&
        targetEl.hasAttribute('sticky2')) return true;

    if (this.el.hasAttribute('sticky2') &&
        (targetEl.hasAttribute('stickable2') ||
         targetEl.hasAttribute('sticky2'))) return true;

    return false;

  },

  collideEnd(event) {

    targetEl = event.detail.targetEl;

    if (targetEl === this.el) {
      console.log(`Ignore collision end with self on ${targetEl.id}`)
      return;
    }

    console.log(`${this.el.id} object ends collide with object ${targetEl.id}`)

    if (this.shouldStickToTarget(targetEl)) {
      const index = this.stickyOverlaps.indexOf(targetEl)

      if (index > -1) {
        console.log(`remove sticky Overlap with ${targetEl.id}`);
        this.stickyOverlaps.splice(index, 1);
        console.log(`${this.stickyOverlaps.length} sticky overlaps in total`);
      }
      else {
        console.warn("Unexpected - collideEnd doesn't match element");
        console.log(`${this.stickyOverlaps} sticky overlaps in total`);
      }
    }
  },

  grabbed() {
    console.log("grabbed - release constraint to static object")

    this.setKinematic();
    this.state = OBJECT_HELD;
    console.log(this.el);
  },

  nonChildStickyOverlap() {
    // is there a sticky overlap that is not a child of ours?

    var nonChldStickyOverlap = null;

    this.stickyOverlaps.forEach((el) => {

      if (!this.isMyDescendent(el.object3D)) {
        nonChldStickyOverlap = el;
      }
    });

    return nonChldStickyOverlap;
  },

  released() {

    toStickTo = this.nonChildStickyOverlap()

    if (toStickTo) {

      // sticky object to parent to.
      console.log("released - re-attach to a parent object")
      this.setKinematic();
      this.state = OBJECT_FIXED;
      this.attachToStickyParent(toStickTo);

    }
    else {
      // become a dynamic object.
      console.log("released - becomes loose dynamic object")

      this.state = OBJECT_LOOSE;
      this.detachFromStickyParent();

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
      }, this.data.releaseTimer);
    }
  },

  tick(time, timeDelta) {

    if (this.data.type === 'static') return;

    /*
    // tie object to sticky parent (which may be moving).
    if (this.state !== OBJECT_HELD && this.stickyParent) {

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

      // apply matrix to object.  But don't apply scale, as not needed,
      // and interferes with snowball growth on roll.
      object.matrix.decompose(object.position, object.quaternion, this.throwaway);
      object.matrixWorldNeedsUpdate = true;
    }*/

    // Track velocity state, in case the object gets released to dynamic physics
    // - in that case we want to initialze velocity
    if (this.state !== OBJECT_LOOSE) {
      this.el.object3D.getWorldPosition(this.lastPositions[this.historyPointer]);
      this.el.object3D.getWorldQuaternion(this.lastQuaternions[this.historyPointer]);
      this.lastTimeDeltas[this.historyPointer] = timeDelta;
      this.historyPointer = 1 - this.historyPointer;
      this.physicsStarting = true;
    }
    else {
      if (this.physicsStarting) {
        // In the first frame after becoming a loose object, we calculate prior velocity & apply it to
        // the object...

        /* Alternative Implementation - we might be able to read linear & angular velocities
           directly from AMmo using
           this.el.body.getLinearVelocity(ammoVelocityVector);
           and
           this.el.body.getAngularVelocity(ammoVelocityVector);

           Not tried/tested that yet.
        */

        // we extract the velocity from the last 2 frames.
        // historyPointer always indicates the older time interval.
        // for TimeDelta, we take the other slot, which tells us the elapsed time *after* that
        // measurement to the newer measurement.
        this.el.object3D.getWorldPosition(this.worldPosition)
        this.velocity.subVectors(this.worldPosition, this.lastPositions[this.historyPointer]);
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
        this.el.object3D.getWorldQuaternion(this.worldQuaternion);
        this.tempQuaternion.copy(this.lastQuaternions[this.historyPointer]).invert();
        this.tempQuaternion.multiply(this.worldQuaternion)

        this.rotationAxis.set(this.tempQuaternion.x,
                              this.tempQuaternion.y,
                              this.tempQuaternion.z).normalize();
        const rotationAngle = this.lastQuaternions[this.historyPointer].angleTo(this.el.object3D.quaternion);
        this.rotationSpeed = rotationAngle * (2000 / (timeDelta + this.lastTimeDeltas[1 - this.historyPointer]));

        this.physicsStarting = false;
      }

      if (this.runHomemadePhysics) {
        this.velocityDelta.copy(this.velocity);
        this.velocityDelta.multiplyScalar(timeDelta / 1000);

        this.el.object3D.getWorldPosition(this.worldPosition);
        this.worldPosition.add(this.velocityDelta);
        this.setWorldPosition(this.el.object3D, this.worldPosition);

        // Apply gravity to velocity for next tick.
        this.velocity.y -= this.data.gravity * timeDelta / 1000;

        // apply rotation.
        const angle = this.rotationSpeed * timeDelta / 1000;
        this.tempQuaternion.setFromAxisAngle(this.rotationAxis, angle);

        this.el.object3D.getWorldQuaternion(this.worldQuaternion)
        this.worldQuaternion.multiply(this.tempQuaternion);
        this.setWorldQuaternion(this.el.object3D, this.worldQuaternion);
      }
    }
  },

  setWorldPosition(object, position) {

    GLOBAL_DATA.tempMatrix.copy(object.parent.matrixWorld).invert();
    position.applyMatrix4(GLOBAL_DATA.tempMatrix);
    this.el.object3D.position.copy(position);
  },

  setWorldQuaternion(object, quaternion) {

    object.parent.getWorldQuaternion(GLOBAL_DATA.tempQuaternion);
    GLOBAL_DATA.tempQuaternion.invert();
    quaternion.premultiply(GLOBAL_DATA.tempQuaternion);
    this.el.object3D.quaternion.copy(quaternion);
  },

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

    this.throwaway = new THREE.Vector3();
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
    el.emit("grabbed", {hand: this.el})
  },

  releaseObject(el) {

    this.removeConstraint(el);
    this.grabbedEl = null;

    // signal to element it has been released.
    el.emit("released", {hand: this.el})

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

    /* Parenting - maybe in future
    if (!this.originalParent) {
      this.originalParent = fromEl.object3D.parent;
    }

    GLOBAL_FUNCS.reparent(fromEl.object3D,
                          fromEl.object3D.parent,
                          toEl.object3D); */

  },

  removeConstraint(fromEl) {

    this.lockedObject = null;
    this.lockedToObject = null;

    /*var newParent = this.originalParent ? this.originalParent : this.el.SceneEl.object3D;

    GLOBAL_FUNCS.reparent(fromEl.object3D,
                          fromEl.object3D.parent,
                          newParent);

    this.originalParent = null;*/
  },

  tick() {

    //if (this.awaitingNewElement) return;

    if (this.lockedObject) {

      if (!this.lockedObject.el.hasAttribute('grabbable')) {
        // object has stopped being grabbable - e.g.a growing snowball.
        this.releaseObject(this.lockedObject.el)
        return;
      }

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

      object.matrix.decompose(object.position, object.quaternion, this.throwaway);
      object.matrixWorldNeedsUpdate = true;
    }
  }

});

AFRAME.registerComponent('hand-keyboard-controls', {

  init() {
    this.gripDown = false;
    this.triggerDown = false;
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
    this.el.addEventListener('toggletrigger', () => {
      if (!this.triggerDown) {
        this.triggerDown = true;
        this.el.emit("triggerdown");
      }
      else {
        this.triggerDown = false;
        this.el.emit("triggerup");        
      }
    });
  }
});
