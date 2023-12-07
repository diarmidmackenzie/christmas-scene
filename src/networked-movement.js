// networked version of `movement` component.  For now only used on select
// elements.
AFRAME.registerComponent('networked-movement', {
  schema: {
    type: {type: 'string', default: 'grabbable', oneOf: ['static', 'grabbable', 'dynamic']},
    stickiness: {type: 'string', default: 'stickable', oneOf: ['sticky', 'stickable', 'sticky2', 'stickable2', 'none']},
    gravity: {type: 'number', default: 9.8},
    initialState: {type: 'string', default: 'kinematic'},
    // how long we run "homegrown" (gravity-only physics, before switching on full collision physics)
    // 150 msecs is enough to fall 11cm, which shuld be enough to clear the hand collider sphere (5cm radius).
    releaseTimer: {type: 'number', default: 150},
    // event to emit on re-attaching.
    attachEvent: {type: 'string'},
    // event to emit on releasing.
    releaseEvent: {type: 'string'}
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
    this.el.setAttribute('networked-body', {kinematic: this.data.initialState === 'kinematic'});
    this.el.setAttribute('ammo-body', `emitCollisionEvents: true; gravity: 0 ${-this.data.gravity} 0`);

    this.playArea = document.getElementById("play-area");

    // Basic logic of this element:
    // When held, kinematic, move anywhere.
    // When released
    // - if in contact with a static object, stay kinematic.
    // - else become dynamic
    this.el.addEventListener("collidestart", this.collideStart.bind(this));
    this.el.addEventListener("collideend", this.collideEnd.bind(this));
    this.el.addEventListener("grabbed", this.grabbed.bind(this));
    this.el.addEventListener("released", this.released.bind(this));
    this.el.addEventListener("dragstart", this.grabbed.bind(this));
    this.el.addEventListener("dragend", this.released.bind(this));

    // was initialized to OBJECT_FIXED in "movement" component,
    // but this leads to objects not sticking at start of day.
    // I don't yet understand how this worked before...
    this.state = OBJECT_LOOSE;
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

    this.worldPosition = new THREE.Vector3();
    this.worldQuaternion = new THREE.Quaternion();
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
    this.el.setAttribute('networked-body', 'kinematic: true');

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
    this.el.setAttribute('networked-body', 'kinematic: false');

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

    // check for a chain of 10 snowballs stuck together
    function countStickySnowballs(el, child) {

      var stickySnowballs;

      if (el.hasAttribute('sticky')) {

         stickySnowballs = 1 + countStickySnowballs(el.object3D.parent.el)
      }
      else {
         stickySnowballs = 0;
      }

      return (stickySnowballs);
    }

    if (countStickySnowballs(this.el) >= 10) {
      this.el.sceneEl.emit("task-stick-snowballs");
    }
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

    NAF.utils.takeOwnership(this.el)
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


    if (this.data.releaseEvent) {
      this.el.sceneEl.emit(this.data.releaseEvent)
    }

    toStickTo = this.nonChildStickyOverlap()

    if (toStickTo) {

      // sticky object to parent to.
      console.log("released - re-attach to a parent object")
      this.setKinematic();
      this.state = OBJECT_FIXED;
      this.attachToStickyParent(toStickTo);

      if (this.data.attachEvent) {
        this.el.sceneEl.emit(this.data.attachEvent)
      }
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
  }
});
