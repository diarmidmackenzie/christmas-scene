AFRAME.registerComponent('networking', {

  schema: {
    audio: {default: true},
    clientCountDisplay: {type: 'selector'}
  },

  init() {

    const adapter = this.data.audio ? 'easyrtc' : 'wseasyrtc'

    this.el.setAttribute('networked-scene', 
                         `serverURL: christmas-scene-naf-server.glitch.me;
                          room: ${ROOM_KEY};
                          adapter: ${adapter};
                          audio: ${this.data.audio}`)
    this.el.setAttribute('persistent-p2p', '')
  },

  tick() {
    if (this.data.clientCountDisplay) {
      const remoteClients = Object.keys(NAF.connection.connectedClients).length
      this.data.clientCountDisplay.innerHTML = `${remoteClients} others in room`
    }
  }
})

AFRAME.registerSystem('networked-body', {

  init() {
    NAF.connection.onConnect(() => {
      this.el.sceneEl.emit('naf-connected')
    })
  }
})

AFRAME.registerComponent('networked-body', {

  schema: {
    kinematic: {default: false},
    // how long to allow an existing client to assert ownership of entities.
    ownershipTimer: {default: 5000} 
  },

  init() {

    // ?? BUG in aframe-physics-system where emitCOllisionEvents has to be set at
    // the same time as ammo-body in the case where ammo-body is set after physics is
    // already iniitalized.
    this.el.setAttribute('ammo-body', 'type: dynamic; emitCollisionEvents: true');

    // better to specify shape separately & explicitly.
    // this.el.setAttribute('ammo-shape', 'fit: auto');
    this.bodyTypeAdjustable = false

    // There appears to be a couple of bugs / limitations in Ammo physic processing.
    // 1. If they are ever to be dynamic, bodies must be dynamic when physics starts on the scene.
    // 2. The first time a dynamic body is switched kinetic, the Ammo body in the physics system (though not the visible mesh itself) continues to be processed as a dynamic body.
    //
    // The workaround used here is to quickly switch the object from dynamic to kinematic & back to dynamic
    // on initialization.
    // This enables fully flexible switching between dynamic & kinematic as required.
    //
    // Note that ammo-body can set the body snchronously (if physics already started - e.g. when
    // spawning an object) or asynchronously (normal case for objects present at start of day).
    const ammoBody = this.el.components['ammo-body']
    if (ammoBody.body) {
      this.initBodyOnceLoaded()
    }
    else {
      this.el.addEventListener("body-loaded", () => {
        this.initBodyOnceLoaded()
      });
    }

    this.el.addEventListener('ownership-gained', this.update.bind(this))
    this.el.addEventListener('ownership-changed', this.update.bind(this))
    this.el.addEventListener('ownership-lost', this.update.bind(this))

    this.el.sceneEl.addEventListener('naf-connected', this.onConnect.bind(this))

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
      });
    }
  },

  update() {

    if (!this.bodyTypeAdjustable) {
      this.el.addEventListener('body-type-adjustable', this.update.bind(this), {once: true})
      return
    }

    if (this.data.kinematic)
    {
      this.el.setAttribute('ammo-body', 'type:kinematic');
    }
    else {
      if (NAF.utils.isMine(this.el)) {
        this.el.setAttribute('ammo-body', 'type:dynamic');
      }
      else {
        this.el.setAttribute('ammo-body', 'type:kinematic');
      }
    }
  },

  onConnect() {

    setTimeout(() => {
      if (this.el.components.networked.data.owner === "scene") {
        console.log("Updating owner for:", this.el.id)
        NAF.utils.takeOwnership(this.el)
        this.update()
      }
    }, this.data.ownershipTimer)  
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

  initBodyOnceLoaded() {
    setTimeout(() => {
      this.el.setAttribute('ammo-body', 'type:kinematic');
      this.el.setAttribute('ammo-body', 'type:dynamic');
      this.bodyTypeAdjustable = true
      this.el.emit('body-type-adjustable')

      // reset position to saved world position if kinematic.
      if (this.data.kinematic) {

        this.setWorldPosition(this.el.object3D, this.worldPosition);
        this.setWorldQuaternion(this.el.object3D, this.worldQuaternion);
      }
    }, 1);
  }
});