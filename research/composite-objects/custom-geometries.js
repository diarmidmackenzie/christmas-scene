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
    const delta = 0.001
    const geometries = [];

    // front ribbon
    geometries.push(new THREE.PlaneGeometry(data.ribbon, data.height));
    geometries[0].translate(0, 0, data.depth/2 + delta);
    // back ribbon
    geometries.push(new THREE.PlaneGeometry(data.ribbon, data.height));
    geometries[1].rotateY(Math.PI);
    geometries[1].translate(0, 0, -data.depth/2 - delta);
    // left ribbon
    geometries.push(new THREE.PlaneGeometry(data.ribbon, data.height));
    geometries[2].rotateY(-Math.PI/2);
    geometries[2].translate(-data.width/2 - delta, 0, 0);
    // right ribbon
    geometries.push(new THREE.PlaneGeometry(data.ribbon, data.height));
    geometries[3].rotateY(Math.PI/2);
    geometries[3].translate(data.width/2 + delta, 0, 0);
    // top ribbons
    geometries.push(new THREE.PlaneGeometry(data.ribbon, data.depth));
    geometries[4].rotateX(-Math.PI/2);
    geometries[4].translate(0, data.height/2 + delta, 0);
    geometries.push(new THREE.PlaneGeometry(data.width, data.ribbon));
    geometries[5].rotateX(-Math.PI/2);
    geometries[5].translate(0, data.height/2+ delta, 0);

    // bottom ribbons
    geometries.push(new THREE.PlaneGeometry(data.ribbon, data.depth));
    geometries[6].rotateX(Math.PI/2);
    geometries[6].translate(0, -data.height/2 - delta, 0);
    geometries.push(new THREE.PlaneGeometry(data.width, data.ribbon));
    geometries[7].rotateX(Math.PI/2);
    geometries[7].translate(0, -data.height/2 - delta, 0);

    // rosette
    geometries.push(new THREE.TorusKnotGeometry(data.ribbon, data.ribbon/4, 30, 3, 7, 11));
    geometries[8].rotateX(Math.PI/2);
    geometries[8].translate(0, data.height/2 + data.ribbon/3 + delta, 0);

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

    // *don't* recenter geometry, as the rosette will ruin the offset vs. a box we
    // wrap the ribbon around.
    //recenterGeometry(this.geometry);
  }
});

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

AFRAME.registerComponent('penguin', {

  init () {
    var materials = [new THREE.MeshBasicMaterial({
                          color: 'black'
                     }), new THREE.MeshBasicMaterial({
                          color: 'white'
                     }), new THREE.MeshBasicMaterial({
                          color: 'orange'
                     })]

    this.el.setAttribute('geometry','primitive:penguin');
    const mesh = this.el.getObject3D('mesh');
    mesh.material = materials;
  }
});
