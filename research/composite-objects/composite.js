AFRAME.registerGeometry('composite', {
  schema: {
    type: {type: 'string', default: 'tophat'},
    depth: {default: 1, min: 0},
    height: {default: 1, min: 0},
    width: {default: 1, min: 0},
    segmentsHeight: {default: 1, min: 1, max: 20, type: 'int'},
    segmentsWidth: {default: 1, min: 1, max: 20, type: 'int'},
    segmentsDepth: {default: 1, min: 1, max: 20, type: 'int'}
  },

  init: function (data) {

    console.log("Using composite geometry");
    this.system = document.querySelector('a-scene').systems['composite-geometry'];
    this.data = data;

    console.log(this.system);
    console.log(this.system.geometries);

    if (!this.system.geometries[data.type]) {
      // geometry not yet registered.
      this.system.sceneEl.addEventListener('geometry-defined', this.geometryDefined.bind(this));
    }
    //const geometryData = system.geometries[data.type]
    //console.log(geometryData);

  },

  geometryDefined: function() {

    if (this.system.geometries[this.data.type]) {
      this.system.sceneEl.removeEventListener('geometry-defined', this.geometryDefined.bind(this));
      this.createGeometry();
    }

  },

  createGeometry: function () {
    console.log(this.system);
    console.log(this.system.geometries);
    this.geometry = new THREE.BoxGeometry(this.data.width, this.data.height, this.data.depth);
  }
});

// defines a compsite geometry
AFRAME.registerSystem('composite-geometry', {

  init() {
    this.geometries = {};
  },
});

// defines a compsite geometry
AFRAME.registerComponent('composite-geometry', {
  schema: {
    type: {type: 'string'}
  },

  init() {
    console.log("Registering composite geometry")
    this.system.geometries[this.data.type] = 'my-geometry-data';
    this.el.sceneEl.emit('geometry-defined');
  },
});
