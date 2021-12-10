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
    // 2 cylinders, one tall and thin for the hat, one short and wider for the brim.
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
      depth: 0.3,
      bevelEnabled: false
    };

    const capShape = new THREE.Shape();
    capShape.absarc(0, 0, 0.15, 0, 2 * Math.PI);
    const capSettings = {
      curveSegments: 5,
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

AFRAME.registerGeometry('icicle', {
  schema: {
  },

  init: function (data) {

    const geometries = [];
    // 3 cylinders, getting gradually pointier
    //radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded
    geometries.push(new THREE.CylinderGeometry(0.2, 0.1, 0.25, 9, 1, true));
    geometries.push(new THREE.CylinderGeometry(0.1, 0.05, 0.25, 9, 1, true));
    geometries[1].translate(0, -0.25, 0);
    geometries.push(new THREE.CylinderGeometry(0.05, 0.01, 0.5, 9, 1, true));
    geometries[2].translate(0, -0.6, 0);

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

    recenterGeometry(this.geometry);
  }
});

AFRAME.registerGeometry('star', {
  schema: {
    points: {default: 5},
    outerRadius: {default: 3},
    innerRadius: {default: 1},
    depth: {default: 0.5},
  },

  init: function (data) {

    var starPoints = [];
    const radii = [data.outerRadius, data.innerRadius]
    var toggle = 0
    for (var ii = 0; ii < (data.points * 2); ii++) {
      const angle = (ii * Math.PI * 2)/data.points;
      const x = radii[toggle] * Math.sin(angle)
      const y = radii[toggle] * Math.cos(angle)

      toggle = 1 - toggle;

      starPoints.push(new THREE.Vector2 (x, y));
    }

    var starShape = new THREE.Shape(starPoints);

    var extrusionSettings = {
        curveSegments: 5,
        depth: data.depth,
        bevelEnabled: false
    };

    var starGeometry = new THREE.ExtrudeGeometry(starShape, extrusionSettings);

    this.geometry = starGeometry;
    recenterGeometry(this.geometry);
  }
});

AFRAME.registerGeometry('ribbon', {
  schema: {
    width: {default: 1},
    height: {default: 1},
    depth: {default: 1},
    ribbon: {default: 0.2},
  },

  init: function (data) {

    // used to avoid z-fighting.
    const delta = 0.00001
    const geometries = [];

    geometries.push(new THREE.PlaneGeometry(data.ribbon, data.height));
    // front ribbon
    geometries[1].translate(0, data.depth/2, 0);
    geometries.push(new THREE.PlaneGeometry(data.ribbon, data.height));
    // back ribbon
    geometries[2].rotateY(0, Math.PI, 0);
    geometries[2].translate(0, -data.depth/2, 0);

    // To be completed...

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

    recenterGeometry(this.geometry);
  }
});
