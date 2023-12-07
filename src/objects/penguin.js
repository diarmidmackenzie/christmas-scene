AFRAME.registerGeometry('penguin', {
  schema: {
  },

  init: function (data) {
    //radiusTop, radiusBottom, height, radialSegments
    const geometriesBlack = [];
    //head
    geometriesBlack.push(new THREE.SphereGeometry(1, 8, 6, -7*Math.PI/6, 4*Math.PI/3));
    //body
    geometriesBlack.push(new THREE.SphereGeometry(1, 8, 6, -7*Math.PI/6, 4*Math.PI/3));
    geometriesBlack[1].translate(0, -1, 0);
    geometriesBlack[1].scale(1, 2, 1);
    //top of head
    geometriesBlack.push(new THREE.SphereGeometry(1.0001, 12, 2, 0, 2*Math.PI, 0, Math.PI/3));

    //left wing
    geometriesBlack.push(new THREE.SphereGeometry(1, 12, 6));
    geometriesBlack[3].translate(-2.5, -2, 0);
    geometriesBlack[3].scale(0.3, 1, 0.3)
    geometriesBlack[3].rotateZ(-0.2)

    //right wing
    geometriesBlack.push(new THREE.SphereGeometry(1, 12, 6));
    geometriesBlack[4].translate(2.5, -2, 0);
    geometriesBlack[4].scale(0.3, 1, 0.3)
    geometriesBlack[4].rotateZ(0.2)

    // left eye
    geometriesBlack.push(new THREE.SphereGeometry(0.2, 12, 6));
    geometriesBlack[5].translate(-0.5, 0.2, 0.75);

    // right eye
    geometriesBlack.push(new THREE.SphereGeometry(0.2, 12, 6));
    geometriesBlack[6].translate(0.5, 0.2, 0.75);

    this.geometryBlack = THREE.BufferGeometryUtils.mergeBufferGeometries(geometriesBlack);

    const geometriesWhite = [];
    //face
    geometriesWhite.push(new THREE.SphereGeometry(1, 4, 4, Math.PI/6, 2*Math.PI/3, Math.PI/3, 2*Math.PI/3));
    //body
    geometriesWhite.push(new THREE.SphereGeometry(1, 8, 6, Math.PI/6, 2*Math.PI/3));
    geometriesWhite[1].translate(0, -1, 0);
    geometriesWhite[1].scale(1, 2, 1);
    this.geometryWhite = THREE.BufferGeometryUtils.mergeBufferGeometries(geometriesWhite);

    const geometriesOrange = [];

    //left foot
    geometriesOrange.push(new THREE.CylinderGeometry(0.3, 0.5, 0.3, 3, 1));
    geometriesOrange[0].rotateY(Math.PI);
    geometriesOrange[0].scale(1, 1, 2.5);
    geometriesOrange[0].translate(-0.5, -3.75, 0.2);

    //right foot
    geometriesOrange.push(new THREE.CylinderGeometry(0.3, 0.5, 0.3, 3, 1));
    geometriesOrange[1].rotateY(Math.PI);
    geometriesOrange[1].scale(1, 1, 2.5);
    geometriesOrange[1].translate(0.5, -3.75, 0.2);

    geometriesOrange.push(new THREE.CylinderGeometry(0, 0.5, 0.5, 3, 1));
    geometriesOrange[2].rotateX(Math.PI/2);
    geometriesOrange[2].translate(0, -0.1, 1);

    this.geometryOrange = THREE.BufferGeometryUtils.mergeBufferGeometries(geometriesOrange);

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries([this.geometryBlack,
                                                                     this.geometryWhite,
                                                                     this.geometryOrange],
                                                                     true);
    recenterGeometry(this.geometry);
  }
});

// Penguin bowling pin.
// Emits "pin-down" event if it falls onto the bowling alley within 500msecs of
// being toppled from vertical.
AFRAME.registerComponent('penguin', {

  init () {

    this.initialPosition = new THREE.Vector3();
    this.initialParent = this.el.object3D.parent;
    this.initialPosition.copy(this.el.object3D.position);

    var materials = [new THREE.MeshStandardMaterial({
                          color: 'black'
                     }), new THREE.MeshStandardMaterial({
                          color: 'white'
                     }), new THREE.MeshStandardMaterial({
                          color: 'orange'
                     })]

    this.el.setAttribute('geometry','primitive:penguin');
    const mesh = this.el.getObject3D('mesh');
    mesh.material = materials;

    this.xAxis = new THREE.Vector3();
    this.yAxis = new THREE.Vector3();
    this.zAxis = new THREE.Vector3();

    this.defaultYAxis = new THREE.Vector3(0, 1, 0);

    //this.el.addEventListener("collidestart", this.onCollide.bind(this));

    this.el.addEventListener("resetPin", this.resetPin.bind(this));

    this.scoreboard = document.getElementById("bowling-alley-scoreboard");
  },

  resetPin() {

    this.el.setAttribute('ammo-body', 'type:kinematic')

    // must be child of bowling alley for repositioning to work.
    GLOBAL_FUNCS.reparent(this.el.object3D,
                          this.el.object3D.parent,
                          this.initialParent);

    const pos = this.el.object3D.position;
    const ipos = this.initialPosition

    //lift it up by 1m.
    this.el.removeAttribute("animation__reset");
    this.el.removeAttribute("animation__resetRotation");

    this.el.setAttribute("animation__reset",
                         `property: position;
                          to: ${pos.x} ${pos.y + 1} ${pos.z}
                          dur: 1000`);
    this.el.setAttribute("animation__resetRotation",
                         `property: rotation;
                          to: 0 0 0; dur: 1000`);

    // hover over initial posiiton.



    setTimeout(() => {
      this.el.setAttribute("animation__reset",
                           `property: position;
                            to: ${ipos.x} ${ipos.y + 1} ${ipos.z}
                            dur: 3000`);
    }, 1200);

    // lower down
    setTimeout(() => {
      this.el.setAttribute("animation__reset",
                           `property: position;
                            to: ${ipos.x} ${ipos.y} ${ipos.z};
                            dur: 1000`);
    }, 4500);

    // set back to dynamic
    setTimeout(() => {
      this.el.setAttribute('ammo-body', 'type:dynamic')
    }, 6000);
  },

/*
  onCollide(event) {

    if (event.detail.targetEl.id === "bowling-alley") {
      // fallen onto bowling alley.
      if (this.toppled) {
        // just fell over
        this.scoreboard.emit("pin-down");
        this.toppled = false;
      }
    }
  },
*/
  // monitor whether knocked over (not held) in bowling pin area.
  tick() {

    this.el.object3D.matrix.extractBasis ( this.xAxis, this.yAxis, this.zAxis);

    if (this.yAxis.angleTo(this.defaultYAxis) < 0.5) {
      // upright
      this.upright = true;
      //this.toppled = false;
    }
    else {
      if (this.upright) {
        // just fallen over.  Generate pin-down event.
        this.upright = false;
        //this.toppled = true;
        this.scoreboard.emit("pin-down");
        this.el.sceneEl.emit("task-knock-penguin");

        //setTimeout(() => this.toppled = false, 500);
      }
    }
  }
});
