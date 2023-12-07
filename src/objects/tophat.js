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

AFRAME.registerGeometry('tophat-hollow', {
  schema: {
  },

  init: function (data) {
    //radiusTop, radiusBottom, height, radialSegments
    const geometries = [];

    const brimShape = new THREE.Shape();
    brimShape.absarc(0, 0, 0.25, 0, 2 * Math.PI);
    const brimHole = new THREE.Path();
    brimHole.absarc(0, 0, 0.15, 0, 2 * Math.PI);
    brimShape.holes.push(brimHole)

    const brimSettings = {
      curveSegments: 5,
    	steps: 1,
    	depth: 0.04,
    	bevelEnabled: false
    };

    const topShape = new THREE.Shape();
    topShape.absarc(0, 0, 0.15, 0, 2 * Math.PI);
    const topHole = new THREE.Path();
    topHole.absarc(0, 0, 0.14, 0, 2 * Math.PI);
    topShape.holes.push(topHole)
    const topSettings = {
      curveSegments: 5,
      steps: 1,
      depth: 0.3,
      bevelEnabled: false
    };

    const capShape = new THREE.Shape();
    capShape.absarc(0, 0, 0.15, 0, 2 * Math.PI);
    const capSettings = {
      curveSegments: 5,
      steps: 1,
      depth: 0.04,
      bevelEnabled: false
    };

    geometries.push(new THREE.ExtrudeGeometry(brimShape, brimSettings));
    geometries.push(new THREE.ExtrudeGeometry(topShape, topSettings));
    geometries.push(new THREE.ExtrudeGeometry(capShape, capSettings));
    geometries[2].translate(0, 0, 0.3);
    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

    recenterGeometry(this.geometry);
    this.geometry.rotateX(-Math.PI/2)
  }
});