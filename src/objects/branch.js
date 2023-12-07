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
