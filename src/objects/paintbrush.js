AFRAME.registerGeometry('paintbrush', {
  schema: {
  },

  init: function (data) {
    //radiusTop, radiusBottom, height, radialSegments
    const geometriesBrush = [];
    //tip of brush
    geometriesBrush.push(new THREE.ConeGeometry(0.5, 1, 8));
    //body of brush
    geometriesBrush.push(new THREE.SphereGeometry(0.5, 8, 8, 0, 2*Math.PI, 0, Math.PI/2));
    geometriesBrush[1].translate(0, 0.5, 0);
    geometriesBrush[1].rotateX(Math.PI);

    this.geometryBrush = THREE.BufferGeometryUtils.mergeBufferGeometries(geometriesBrush);

    //neck of brush
    const geometryNeck = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 8, 1);
    geometryNeck.translate(0, -1, 0);

    // Handle of brush
    const geometriesHandle = []
    geometriesHandle.push(new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8, 1));
    geometriesHandle[0].translate(0, -1.4, 0);

    geometriesHandle.push(new THREE.CylinderGeometry(0.3, 0.2, 3.8, 8, 1));
    geometriesHandle[1].translate(0, -3.5, 0);

    this.geometryHandle = THREE.BufferGeometryUtils.mergeBufferGeometries(geometriesHandle);

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries([this.geometryBrush,
                                                                     geometryNeck,
                                                                     this.geometryHandle],
                                                                     true);
    recenterGeometry(this.geometry);
  }
});


AFRAME.registerComponent('paintbrush', {

  schema: {
    color: {type: 'color', default: 'blue'}
  },

  init () {
    var materials = [new THREE.MeshStandardMaterial({
                          color: this.data.color
                     }), new THREE.MeshStandardMaterial({
                          color: 'silver'
                     }), new THREE.MeshStandardMaterial({
                          color: 'brown'
                     })]

    this.el.setAttribute('geometry','primitive:paintbrush');
    this.mesh = this.el.getObject3D('mesh');
    this.mesh.material = materials;

    this.el.setAttribute('movement', "type:grabbable; stickiness:stickable");
    this.el.setAttribute('ammo-shape', 'type: hull');

    this.color = new THREE.Color();
    this.color.setStyle(this.data.color);

    this.el.addEventListener("grabbed", this.grabbed.bind(this));
    this.el.addEventListener("released", this.released.bind(this));

    this.hand = null;

    this.xAxis = new THREE.Vector3();
    this.yAxis = new THREE.Vector3();
    this.zAxis = new THREE.Vector3();
    this.euler = new THREE.Euler();
  },

  grabbed(event) {

    if (this.hand) {
      this.released();
    }

    this.hand = event.detail.hand;
    this.hand.addEventListener("triggerdown", this.gripped.bind(this));
    this.hand.addEventListener("triggerup", this.ungripped.bind(this));

  },

  released() {
    this.hand.removeEventListener("triggerdown", this.gripped.bind(this));
    this.hand.removeEventListener("triggerup", this.ungripped.bind(this));
    this.hand = null;
  },

  gripped() {

    this.colorChange = true;
  },

  ungripped() {

    this.colorChange = false;
  },

  tick() {

    if (this.colorChange) {

      this.el.object3D.matrix.extractBasis ( this.xAxis, this.yAxis, this.zAxis);

      const saturation = 1.0;

      // straight up for very light, straight down for very dark.
      const lightness = 0.5 + (this.yAxis.normalize().y / 2);

      // rotation about y axis gives hue.
      this.euler.copy(this.el.object3D.rotation);
      this.euler.reorder("YXZ");
      const hue = (this.euler.y / (Math.PI * 2)) % 1.

      this.color.setHSL(hue, saturation, lightness);

      this.mesh.material[0].color.copy(this.color)
    }
  }

});

AFRAME.registerComponent('paintable', {

  schema: {
    snowball: {type: 'boolean', default: false}
  },

  init() {
    this.el.addEventListener('collidestart', this.onCollide.bind(this));
    this.color = new THREE.Color();
  },

  onCollide(event) {

    const targetEl = event.detail.targetEl;

    if (!targetEl || !targetEl.hasAttribute('paintbrush')) return;

    const color = targetEl.components['paintbrush'].color;

    this.el.setAttribute('material', `color: #${this.snowColor(color).getHexString()}`);

    if (this.data.snowball) {
      this.el.sceneEl.emit("snowball-painted")
    }
    else {
      this.el.sceneEl.emit("icicle-painted")
    }
  },

  snowColor(color) {

    this.color.copy(color);

    this.color.r = 0.5 + (this.color.r/2);
    this.color.g = 0.5 + (this.color.g/2);
    this.color.b = 0.5 + (this.color.b/2);

    return(this.color);
  }
});
