AFRAME.registerGeometry('trophy', {
  schema: {
  },

  init: function (data) {
    //radiusTop, radiusBottom, height, radialSegments
    const geometries = [];
    // 2 cylinders, one tall and thin for the hat, one short and wider for the brim.
    geometries.push(new THREE.CylinderGeometry(0.05, 0.5, 0.25, 12));
    geometries.push(new THREE.SphereGeometry(0.5, 12, 6, 0, 2*Math.PI, 0, Math.PI/2));
    geometries[1].rotateX(Math.PI);
    geometries[1].translate(0, 0.5, 0);
    geometries.push(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12));
    geometries[2].translate(0, 0.65, 0);
    geometries.push(new THREE.CylinderGeometry(0.05, 0.55, 0.3, 12));
    geometries[3].translate(0, 0.95, 0);
    geometries.push(new THREE.SphereGeometry(0.1, 12, 6));
    geometries[4].translate(0, 1.1, 0);
    geometries.push(new THREE.TorusGeometry(0.5, 0.05, 12, 36));
    geometries[5].translate(0, 1.0, 0);
    geometries[5].scale(1.5, 0.5, 1);

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
    recenterGeometry(this.geometry);
  }
});