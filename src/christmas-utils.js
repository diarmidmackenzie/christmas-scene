function recenterGeometry(geometry) {
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();

  center.addVectors(geometry.boundingBox.min, geometry.boundingBox.max);
  center.multiplyScalar(0.5);
  geometry.translate(-center.x, -center.y, -center.z)
  geometry.computeBoundingBox();
}

AFRAME.registerGeometry('branch', {
  schema: {
  },

  init: function (data) {
    //radiusTop, radiusBottom, height, radialSegments
    const geometries = []
    // 3 initial long segments
    geometries.push(new THREE.CylinderGeometry(0.09, 0.1, 1, 7));
    geometries.push(new THREE.CylinderGeometry(0.08, 0.09, 1, 7));
    geometries.push(new THREE.CylinderGeometry(0.07, 0.08, 1, 7));
    // 3 "fingers" of varying lengths & girths
    geometries.push(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 7));
    geometries.push(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 7));
    geometries.push(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 7));

    // now position these relative to each other.
    geometries[0].translate(0.14, -0.9, 0);
    geometries[1].rotateZ(0.3);
    geometries[2].translate(-0.14, 0.9, 0);
    geometries[3].translate(0.14, 1.62, 0);
    geometries[3].rotateZ(0.2);
    geometries[4].translate(0.4, 1.5, 0);
    geometries[4].rotateZ(0.5);
    geometries[5].translate(-0.8, 1.5, 0);
    geometries[5].rotateZ(-0.5);

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

    recenterGeometry(this.geometry);
  }
});

AFRAME.registerGeometry('tophat', {
  schema: {
  },

  init: function (data) {
    //radiusTop, radiusBottom, height, radialSegments
    const geometries = [];
    // 3 initial long segments
    geometries.push(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 11));
    geometries.push(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 11));
    geometries[1].translate(0, 0.15, 0);
    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

    recenterGeometry(this.geometry);
  }
});

AFRAME.registerComponent('cylindrical-position', {
  schema: {
    height: {type: 'number', default: 1.6},
    radius: {type: 'number', default: 1},
    angle: {type: 'number', default: 0},
    faceInward: {type: 'boolean', default: true},
  },

  update() {
    const radians = Math.PI * this.data.angle / 180

    this.el.object3D.position.x = this.data.radius * Math.sin(radians)
    this.el.object3D.position.y = this.data.height
    this.el.object3D.position.z = -this.data.radius * Math.cos(radians)

    this.el.object3D.rotation.x = 0
    this.el.object3D.rotation.y = -radians + (this.data.faceInward ? 0 : Math.PI)
    this.el.object3D.rotation.z = 0
  },
});
