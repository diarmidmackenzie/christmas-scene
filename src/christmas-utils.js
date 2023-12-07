function recenterGeometry(geometry) {
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();

  center.addVectors(geometry.boundingBox.min, geometry.boundingBox.max);
  center.multiplyScalar(0.5);
  geometry.translate(-center.x, -center.y, -center.z)
  geometry.computeBoundingBox();
}

AFRAME.registerComponent('cylindrical-position', {
  schema: {
    height: {type: 'number', default: 1.6},
    radius: {type: 'number', default: 1},
    angle: {type: 'number', default: 0},
    faceInward: {type: 'boolean', default: true},
    randomOrientation: {type: 'boolean', default: false},
  },

  update() {
    const radians = Math.PI * this.data.angle / 180

    this.el.object3D.position.x = this.data.radius * Math.sin(radians)
    this.el.object3D.position.y = this.data.height
    this.el.object3D.position.z = -this.data.radius * Math.cos(radians)

    this.el.object3D.rotation.x = 0
    if (this.data.randomOrientation) {
      this.el.object3D.rotation.y = Math.random() * Math.PI * 2;
    }
    else {
      this.el.object3D.rotation.y = -radians + (this.data.faceInward ? 0 : Math.PI)
    }
    this.el.object3D.rotation.z = 0
  },
});
