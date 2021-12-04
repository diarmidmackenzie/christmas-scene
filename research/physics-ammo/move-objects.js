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

  init() {
    this.el.setAttribute('ammo-body', 'type: kinematic');
    this.el.setAttribute('ammo-body', 'emitCollisionEvents: true');
    this.el.setAttribute('ammo-shape', 'type: hull');

    // Basic logic of this element:
    // When held, disable physic, move anywhere.
    // When released
    // - if in contact with a static object, become fixed.
    // - else become free (dynamic physics object)
    this.el.addEventListener("collidestart", this.collideStart.bind(this));
    this.el.addEventListener("collideend", this.collideEnd.bind(this));
    this.el.addEventListener("grabbed", this.grabbed.bind(this));
    this.el.addEventListener("released", this.released.bind(this));

    this.state = OBJECT_FIXED;
    this.stickyOverlaps = [];
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
    //if (this.el.components['ammo-body'].data.type === 'kinematic') return;

    /* Attempt to recreate a whole new object - really not working!

    const position = this.el.getAttribute('position');
    const rotation = this.el.getAttribute('rotation');
    this.el.setAttribute('position', position);
    this.el.setAttribute('rotation', rotation);
    this.el.flushToDOM();
    this.el.setAttribute('ammo-body', 'type: kinematic');
    newEl = this.el.cloneNode();
    this.el.parentNode.appendChild(newEl);
    this.el.emit('replace-element', {oldEl: this.el, newEl: newEl});
    this.el.parentNode.removeChild(this.el);*/
    /*
    this.el.removeEventListener("collidestart", this.collideStart.bind(this));
    this.el.removeEventListener("collideend", this.collideEnd.bind(this));
    this.el.removeAttribute('ammo-body');
    this.el.removeAttribute('ammo-shape');
    this.el.setAttribute('ammo-body', 'type: kinematic; emitCollisionEvents: true');
    this.el.setAttribute('ammo-shape', 'type: hull');
    //this.stickyOverlaps = []; // reflects the fact that collisions data seemed to be cleared out.

    this.el.addEventListener("collidestart", this.collideStart.bind(this));
    this.el.addEventListener("collideend", this.collideEnd.bind(this));
    */

    /* simplest update... */
    //this.el.setAttribute('ammo-body', 'mass: 1.101'); // needed to bypasss Ammo code that ignores first update.
    //this.el.setAttribute('ammo-body', 'type: kinematic');

    // Given up on AMmo physics for now, implementing my own gravity...
    this.basicGravity = false;
  },

  setDynamic() {
    // set object to dynamic.
    console.log("set to dynamic")

    //if (this.el.components['ammo-body'].data.type === 'dynamic') return;

/* Attempt to recreate a whole new object - really not working!
    const position = this.el.getAttribute('position');
    const rotation = this.el.getAttribute('rotation');
    this.el.setAttribute('position', position);
    this.el.setAttribute('rotation', rotation);
    this.el.flushToDOM();
    this.el.setAttribute('ammo-body', 'type: dynamic');
    newEl = this.el.cloneNode();
    this.el.parentNode.appendChild(newEl);
    this.el.emit('replace-element', {oldEl: this.el, newEl: newEl});
    this.el.parentNode.removeChild(this.el);
*/
    /*
    this.el.removeEventListener("collidestart", this.collideStart.bind(this));
    this.el.removeEventListener("collideend", this.collideEnd.bind(this));
    this.el.removeAttribute('ammo-body');
    this.el.removeAttribute('ammo-shape');
    this.el.setAttribute('ammo-body', 'type: dynamic; emitCollisionEvents: true');
    this.el.setAttribute('ammo-shape', 'type: hull');
    //this.stickyOverlaps = [];
    this.el.addEventListener("collidestart", this.collideStart.bind(this));
    this.el.addEventListener("collideend", this.collideEnd.bind(this));
    */

    /* simplest update... */
    //this.el.setAttribute('ammo-body', 'mass: 1.102'); // needed to bypasss Ammo code that ignores first update.
    //this.el.setAttribute('ammo-body', 'type: dynamic');

    // Given up on AMmo physics for now, implementing my own gravity...
    this.basicGravity = true;
    this.yVelocity = 0;
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
         this.el.setAttribute('ammo-constraint__static', `target:#${targetEl.id}`);
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

  grabbed() {
    console.log("grabbed - release constraint to static object")
    this.el.removeAttribute('ammo-constraint__static');
    //this.setDynamic(); // dynamic needed for constraint to work.
    this.setKinematic(); // using parenting instead of constraints.
    this.state = OBJECT_HELD;
    console.log(this.el);
    //this.stickyOverlaps = [];
  },

  released() {
    if (this.stickyOverlaps.length > 0) {
      // overlaps with a static object.
      console.log("released - re-attach to static object")
      this.setKinematic();
      this.el.setAttribute('ammo-constraint__static', `target:#${this.stickyOverlaps[0].id}`);
      this.state = OBJECT_FIXED;
    }
    else {
      // become a dynamic object.
      console.log("released - becomes loose dynamic object")
      this.setDynamic();
      this.state = OBJECT_LOOSE;
    }
  },

  tick(time, timeDelta) {

    if (this.basicGravity) {
      this.el.object3D.position.y += this.yVelocity * timeDelta / 1000;
      this.yVelocity -= 9.8 * timeDelta / 1000;
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
  },

  gripDown() {

    this.gripDown = true;

    if (this.collisions.length > 0) {
      console.log("grab object on grip down")
      this.grabObject(this.collisions[0]);
    }
  },

  gripUp() {

    this.gripDown = false;

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
      /*if (this.grabbedEl === targetEl) {
        this.releaseObject(this.grabbedEl);
      }*/
    }
  },

  grabObject(el) {
    // constrain object to controller.
    // constraint goes from controller to object.
    this.setConstraint(el, this.collider);
    // switching parent - save off old parent first.  If
    // already a saved parent, keep that one.
/*
    if (this.savedParent == null) {
      this.savedParent = el.object3D.parent;
    }
    this.reparent(el.object3D, el.object3D.parent, this.el.object3D)*/
    this.grabbedEl = el;
    //this.awaitingNewElement = true;
    el.addEventListener('replace-element', this.elementReplaced.bind(this));

    // need to manually update this as we won't get a collisionend event after reparenting.
    //this.collisions = [];

    // signal to element it has been grabbed.
    el.emit("grabbed")
  },

  elementReplaced(event) {

    //this.awaitingNewElement = false;

    if (this.grabbedEl === event.detail.oldEl) {
      this.grabbedEl = event.detail.newEl
    }

    if (this.lockedObject === event.detail.oldEl.object3D) {
      this.lockedObject = event.detail.newEl.object3D;
    }
  },

  releaseObject(el) {

    // reparent object3D to previous parent..
    this.removeConstraint(el);
    /*this.reparent(el.object3D, this.el.object3D, this.savedParent)
    this.savedParent = null; */
    this.grabbedEl = null;

    // signal to element it has been released.
    el.emit("released")

    // need to manually update this as we won't get a collisionend event after reparenting.
    //this.collisions = [];
  },
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
  reparent(object, oldParent, newParent) {

    this.tempMatrix.copy(newParent.matrixWorld).invert();
    object.matrix.premultiply(oldParent.matrixWorld);
    object.matrix.premultiply(this.tempMatrix);
    object.matrix.decompose(object.position, object.quaternion, object.scale);
    object.matrixWorldNeedsUpdate = true;
    newParent.add(object);
  },

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
