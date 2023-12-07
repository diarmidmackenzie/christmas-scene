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
