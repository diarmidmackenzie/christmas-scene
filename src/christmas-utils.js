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

// Penguin bowling pin.
// Emits "pin-down" event if it falls onto the bowling alley within 500msecs of
// being toppled from vertical.
AFRAME.registerComponent('penguin', {

  init () {

    this.initialPosition = new THREE.Vector3();
    this.initialParent = this.el.object3D.parent;
    this.initialPosition.copy(this.el.object3D.position);

    var materials = [new THREE.MeshStandardMaterial({
                          color: 'black'
                     }), new THREE.MeshStandardMaterial({
                          color: 'white'
                     }), new THREE.MeshStandardMaterial({
                          color: 'orange'
                     })]

    this.el.setAttribute('geometry','primitive:penguin');
    const mesh = this.el.getObject3D('mesh');
    mesh.material = materials;

    this.xAxis = new THREE.Vector3();
    this.yAxis = new THREE.Vector3();
    this.zAxis = new THREE.Vector3();

    this.defaultYAxis = new THREE.Vector3(0, 1, 0);

    //this.el.addEventListener("collidestart", this.onCollide.bind(this));

    this.el.addEventListener("resetPin", this.resetPin.bind(this));

    this.scoreboard = document.getElementById("bowling-alley-scoreboard");
  },

  resetPin() {

    this.el.setAttribute('ammo-body', 'type:kinematic')

    // must be child of bowling alley for repositioning to work.
    GLOBAL_FUNCS.reparent(this.el.object3D,
                          this.el.object3D.parent,
                          this.initialParent);

    const pos = this.el.object3D.position;
    const ipos = this.initialPosition

    //lift it up by 1m.
    this.el.removeAttribute("animation__reset");
    this.el.removeAttribute("animation__resetRotation");

    this.el.setAttribute("animation__reset",
                         `property: position;
                          to: ${pos.x} ${pos.y + 1} ${pos.z}
                          dur: 1000`);
    this.el.setAttribute("animation__resetRotation",
                         `property: rotation;
                          to: 0 0 0; dur: 1000`);

    // hover over initial posiiton.



    setTimeout(() => {
      this.el.setAttribute("animation__reset",
                           `property: position;
                            to: ${ipos.x} ${ipos.y + 1} ${ipos.z}
                            dur: 3000`);
    }, 1200);

    // lower down
    setTimeout(() => {
      this.el.setAttribute("animation__reset",
                           `property: position;
                            to: ${ipos.x} ${ipos.y} ${ipos.z};
                            dur: 1000`);
    }, 4500);

    // set back to dynamic
    setTimeout(() => {
      this.el.setAttribute('ammo-body', 'type:dynamic')
    }, 6000);
  },

/*
  onCollide(event) {

    if (event.detail.targetEl.id === "bowling-alley") {
      // fallen onto bowling alley.
      if (this.toppled) {
        // just fell over
        this.scoreboard.emit("pin-down");
        this.toppled = false;
      }
    }
  },
*/
  // monitor whether knocked over (not held) in bowling pin area.
  tick() {

    this.el.object3D.matrix.extractBasis ( this.xAxis, this.yAxis, this.zAxis);

    if (this.yAxis.angleTo(this.defaultYAxis) < 0.5) {
      // upright
      this.upright = true;
      //this.toppled = false;
    }
    else {
      if (this.upright) {
        // just fallen over.  Generate pin-down event.
        this.upright = false;
        //this.toppled = true;
        this.scoreboard.emit("pin-down");
        this.el.sceneEl.emit("task-knock-penguin");

        //setTimeout(() => this.toppled = false, 500);
      }
    }
  }
});

AFRAME.registerComponent('bowling-alley-scoreboard', {

  init() {
    this.text = document.createElement('a-text');
    this.text.setAttribute('value', '');
    this.text.setAttribute('wrap-count', '7');
    this.text.setAttribute('color', 'blue');
    this.text.setAttribute('width', '5.0');
    this.text.setAttribute('align', 'center');

    this.el.appendChild(this.text);

    this.el.addEventListener("pin-down", this.pinDown.bind(this));

    this.lastPinCount = 0;
    this.pinCount = 0;
    this.countingFallenPins = false;

    this.sweeper = document.getElementById('bowling-alley-sweeper')

    this.sweeper.addEventListener("sweep", this.startSweep.bind(this));

  },

  startSweep() {
    // on sweep, we disable strike detection for ~15 seconds.
    this.sweeping = true;

    setTimeout(() => {
      this.sweeping = false;
    }, 15000);
  },

  pinDown() {

    if (this.sweeping) return;

    if (!this.countingFallenPins) {
      // First pin down, start counting...
      this.pinCount = 1;
      this.countingFallenPins = true;

      setTimeout(() => this.displayScore(), 2000)
    }
    else {
      this.pinCount += 1;
    }
  },

  displayScore() {

    var scoreText = "";
    this.countingFallenPins = false;

    if (this.pinCount >= 10) {
      scoreText = "STRIKE!"
      this.el.sceneEl.emit("task-strike-bowling");
    }

    this.text.setAttribute('value', scoreText);

    if (this.clearTimer) {
      // reset scoreboard clearing timer.
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = setTimeout(() => this.clearScore(), 10000)

    // save pin count for next time.
    this.lastPinCount = this.pinCount;
    this.pinCount = 0;
  },

  clearScore() {
    this.text.setAttribute('value', "");
  }

});

AFRAME.registerComponent('bowling-alley-sweeper', {

  init() {
    this.el.addEventListener("sweep", this.sweep.bind(this));
    this.el.addEventListener("resetPins", this.resetPins.bind(this));
  },

  sweep() {

    // raise it up.
    this.el.removeAttribute("animation__sweep");
    this.el.setAttribute("animation__sweep",
                         "property: position; to: 0 0.7 6.2; dur: 1000");

    // sweep
    setTimeout(() => {
      this.el.setAttribute("animation__sweep",
                           "property: position; to: 0 0.7 -6.2; dur: 4000");
    }, 1200);

    // put away
    setTimeout(() => {
      this.el.setAttribute("animation__sweep",
                           "property: position; to: 0 0 -6.2; dur: 1000");
    }, 5500);

    // bring back to start
    setTimeout(() => {
      this.el.setAttribute("position", "0 0 6.2");
    }, 7000);
  },

  resetPins() {
    penguins = document.querySelectorAll('[penguin]')

    penguins.forEach((el) => {
      el.emit("resetPin");
    })

    this.el.sceneEl.emit("task-reset-bowling");
  }
});

AFRAME.registerComponent('bowling-alley-reset', {

  init() {
    this.el.addEventListener('pressed', this.buttonPressed.bind(this));

    this.sweeper = document.getElementById('bowling-alley-sweeper')

  },

  buttonPressed() {

    this.sweeper.emit("sweep");
    // this.sweeper.emit("resetPins"); // to do at same time...

    setTimeout(() => {
      this.sweeper.emit("resetPins")
    }, 7000); // to do in sequence (more fun cos penguins go flying? :-)
  }
});


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

const CHRISTMAS_XYL_NOTES = [
  '#xC',
  '#xD',
  '#xE',
  '#xF',
  '#xG',
  '#xA',
  '#xB',
  '#xC2'
]

AFRAME.registerComponent('xylophone', {
  schema: {
    count: {type: 'number', default: 5},
    width: {type: 'number', default: 1},
    factor: {type: 'number', default: 1.1}
  },

  init() {

    this.notes = [];
    var baseWidth = 0.4; // base width of icicle model
    var totalWidth = 0;

    // compute how large the total construction will be.
    for (var ii = 0; ii < this.data.count; ii++) {
      totalWidth += baseWidth * Math.pow(this.data.factor, ii);
    }

    const scaleFactor = this.data.width / totalWidth;
    var xPos = -this.data.width / 2;

    for (var ii = 0; ii < this.data.count; ii++) {
      const note = document.createElement('a-entity');
      note.setAttribute('geometry', 'primitive:icicle');
      note.setAttribute('material', 'color:white;metalness:0.8;roughness:0.2;envMap:#env');
      note.setAttribute('paintable', '');
      const noteIndex = Math.max(7 - ii, 0);
      note.setAttribute('musical-note', `note: ${CHRISTMAS_XYL_NOTES[noteIndex]}`);
      const scale = scaleFactor * Math.pow(this.data.factor, ii);
      note.object3D.scale.set(scale, scale, scale);
      xPos += (scale * baseWidth / 2)
      note.object3D.position.x = xPos;
      xPos += (scale * baseWidth / 2)
      note.object3D.position.y = -scale / 2

      this.el.appendChild(note);
      this.notes.push(note)
    }
  }
});

AFRAME.registerComponent('musical-note', {
  schema: {
    note: {type: 'selector', default: '#xC'}
  },

  init() {
    // for collision detection, we need a static physics object.
    this.el.setAttribute('ammo-body', 'type: static; emitCollisionEvents: true');
    this.el.setAttribute('ammo-shape', 'type: hull');

    this.el.setAttribute('sound', {src: `#${this.data.note.id}`});

    // event listener to play on collide.
    // slight delay before setting up to avoid triggering collides on physics init.
    this.el.addEventListener('body-loaded', () => {
      setTimeout(() => {
        this.el.addEventListener('collidestart', this.onCollide.bind(this));
      }, 500)
    });
  },

  onCollide() {

    // we stop before playing, to allow for the same not to play twice
    // in a row, quickly.
    this.el.components['sound'].stopSound();
    this.el.components['sound'].playSound();

    this.el.sceneEl.emit("task-xylophone");
    this.el.sceneEl.emit("music-note", {note: this.data.note.id});
  }
});

AFRAME.registerComponent('calendar', {
  schema: {
    width: {type: 'number', default: 0.3},
    height: {type: 'number', default: 0.3},
    depth: {type: 'number', default: 0.1}
  },

  init() {

    this.date = new Date();

    const language = navigator.language || navigator.browserLanguage || ( navigator.languages || [ "en" ] ) [ 0 ]

    const day = this.date.getDate()
    const weekdayOptions = { weekday: 'long'};
    const weekday = this.date.toLocaleDateString(language, weekdayOptions);
    const monthOptions = { month: 'long'};
    const month = this.date.toLocaleDateString(language, monthOptions);

    this.box = document.createElement('a-box');
    this.box.setAttribute('height', this.data.height);
    this.box.setAttribute('width', this.data.width);
    this.box.setAttribute('depth', this.data.depth);
    this.box.setAttribute('color', '#f88');
    this.box.setAttribute('movement', 'type:static;stickiness:none');
    this.box.setAttribute('ammo-shape', 'type:box');
    this.el.appendChild(this.box);

    this.day = document.createElement('a-text');
    this.day.setAttribute('width', this.data.width);
    this.day.setAttribute('align', 'center');
    this.day.setAttribute('wrap-count', 3);
    this.day.setAttribute('value', day);
    this.day.setAttribute('color', 'black');
    this.day.object3D.position.z = this.data.depth / 2;
    this.box.appendChild(this.day);

    this.weekday = document.createElement('a-text');
    this.weekday.setAttribute('width', this.data.width);
    this.weekday.setAttribute('align', 'center');
    this.weekday.setAttribute('wrap-count', 15);
    this.weekday.setAttribute('value', weekday);
    this.weekday.setAttribute('color', 'black');
    this.weekday.object3D.position.y = this.data.height / 3;
    this.weekday.object3D.position.z = this.data.depth / 2;
    this.box.appendChild(this.weekday);

    this.month = document.createElement('a-text');
    this.month.setAttribute('width', this.data.width);
    this.month.setAttribute('align', 'center');
    this.month.setAttribute('wrap-count', 15);
    this.month.setAttribute('value', month);
    this.month.setAttribute('color', 'black');
    this.month.object3D.position.y = -(this.data.height / 3);
    this.month.object3D.position.z = this.data.depth / 2;
    this.box.appendChild(this.month);
  }
});

AFRAME.registerComponent('xmas-counter', {
  schema: {
    width: {type: 'number', default: 0.3},
    height: {type: 'number', default: 0.3},
    depth: {type: 'number', default: 0.1}
  },

  init() {

    this.date = new Date();
    const year = this.date.getFullYear();
    // months are zero-based so December = 11...(!)
    var nextChristmas = new Date(year, 11, 25);

    if (this.date > nextChristmas) {
      nextChristmas = new Date(year + 1, 11, 25);
    }

    const differenceMsecs = nextChristmas.getTime() - this.date.getTime();
    const daysToGo = Math.ceil(differenceMsecs / (1000 * 3600 * 24));

    this.box = document.createElement('a-box');
    this.box.setAttribute('height', this.data.height);
    this.box.setAttribute('width', this.data.width);
    this.box.setAttribute('depth', this.data.depth);
    this.box.setAttribute('color', '#8f8');
    this.box.setAttribute('movement', 'type:static;stickness:none');
    this.box.setAttribute('ammo-shape', 'type:box');
    this.el.appendChild(this.box);

    this.day = document.createElement('a-text');
    this.day.setAttribute('width', this.data.width);
    this.day.setAttribute('align', 'center');
    this.day.setAttribute('wrap-count', 3);
    this.day.setAttribute('value', daysToGo);
    this.day.setAttribute('color', 'black');
    this.day.object3D.position.y = this.data.height / 6;
    this.day.object3D.position.z = this.data.depth / 2;
    this.box.appendChild(this.day);

    this.caption = document.createElement('a-text');
    this.caption.setAttribute('width', this.data.width);
    this.caption.setAttribute('align', 'center');
    this.caption.setAttribute('wrap-count', 15);
    this.caption.setAttribute('value', "days to\nChristmas");
    this.caption.setAttribute('color', 'black');
    this.caption.object3D.position.y = -this.data.height / 4;
    this.caption.object3D.position.z = this.data.depth / 2;
    this.box.appendChild(this.caption);
  }
});

AFRAME.registerComponent('snowball-generator', {

  schema: {
    // height level must go below to generate a snowball
    heightLevel: {type: 'number', default: 0.1},
    // how long must stay there with grip held down to generate a snowball.
    timer: {type: 'number', default: 1000},
    mixin: {type: 'string', default: 'snowball'},
    scale: {type: 'number', default: 0.15}

  },

  init() {

    this.timePassed = 0;
    this.el.addEventListener("gripdown", this.gripDown.bind(this));
    this.el.addEventListener("gripup", this.gripUp.bind(this));

    this.playArea = document.getElementById("play-area");
  },


  tick(time, timeDelta) {

    // To create a snowball, certain conditions must be met continuously for
    // a set period of time.
    const emptyHand = (!this.el.components['hand'] ||
                       !this.el.components['hand'].grabbedEl);

    if (emptyHand &&
        this.el.object3D.position.y <= this.data.heightLevel &&
        this.gripIsDown) {

      this.timePassed += timeDelta;

      if (this.timePassed > this.data.timer) {
        this.createSnowball();
        // for our purposes, consider grip up
        // i.e. don't make any more snowballs until user
        // explicitly grips down again.
        this.gripIsDown = false;
      }
    }
    else {
      // conditions not met - reset timer to zero.
      this.timePassed = 0;
    }
  },

  gripDown() {
    this.gripIsDown = true;
  },

  gripUp() {
    this.gripIsDown = false;
  },

  createSnowball() {

    snowball = document.createElement('a-entity');
    snowball.setAttribute('mixin', this.data.mixin)
    const radius = snowball.mixinEls[0].componentCache.geometry.radius;
    snowball.setAttribute('ammo-shape', `type:sphere; fit:manual; sphereRadius:${radius * this.data.scale}`)
    snowball.setAttribute('id', `snowball-${Math.random().toFixed(4)}`)
    snowball.object3D.scale.set(this.data.scale, this.data.scale, this.data.scale);
    this.el.object3D.getWorldPosition(snowball.object3D.position);
    snowball.setAttribute('snowball-grow-on-roll', "");
    this.playArea.appendChild(snowball);

    this.el.sceneEl.emit("task-snowball")
  }
});

AFRAME.registerComponent('snowball-grow-on-roll', {

  schema: {
    // snowball center must be below radius + this height to grow.
    heightDelta: {type: 'number', default: 0.01},
    // Growth of radius per radius travelled.
    // This factor is added to "scale" for each radian of rotation.
    growthRate: {type: 'number', default: 0.01},

    // radius at which snowballs cease to be grabbable/stickable.
    // not working yet,
    //maxGrabbableRadius:  {type: 'number', default: 0.2},
  },

  init() {

    this.lastWorldPosition = new THREE.Vector3()
    this.lastWorldQuaternion = new THREE.Quaternion()
    this.el.object3D.getWorldPosition(this.lastWorldPosition);
    this.el.object3D.getWorldQuaternion(this.lastWorldQuaternion);

    this.geometryRadius = this.el.mixinEls[0].componentCache.geometry.radius;
    this.setRadius();

    // used in calculations
    this.currentWorldPosition = new THREE.Vector3()
    this.currentWorldQuaternion = new THREE.Quaternion()
    this.distanceMoved = new THREE.Vector3()
  },

  setRadius() {

    this.radius = this.geometryRadius * this.el.object3D.scale.x;
    this.maxHeight = this.radius + this.data.heightDelta;

    /*if (this.radius > this.data.maxGrabbableRadius) {
      this.el.setAttribute('movement', "type:dynamic; stickiness:none");
    }*/

    if (this.radius > 0.3) {
        this.el.sceneEl.emit("task-big-snowball");
    }
  },

  tick(time, timeDelta) {

    this.el.object3D.getWorldPosition(this.currentWorldPosition);
    this.el.object3D.getWorldQuaternion(this.currentWorldQuaternion);

    if (this.lastWorldPosition.y < this.maxHeight &&
        this.currentWorldPosition.y < this.maxHeight) {
      // snowball stayed below height limit.
      // grow it by horoizontal distance travelled.

      /* Distance-bsed - growth not using this */
      /*this.distanceMoved.subVectors(this.currentWorldPosition,
                                    this.lastWorldPosition);
      this.distanceMoved.y = 0;

      const distance = this.distanceMoved.length();*/

      const distance = this.lastWorldQuaternion.angleTo(this.currentWorldQuaternion);

      // require minium amount of turning speed before we grow.
      if (distance * 1000/timeDelta > 0.5) {

        const growthAmount = 0.1 * this.data.growthRate * distance / this.radius;

        const newScale = this.el.object3D.scale.x + growthAmount;
        this.el.object3D.scale.set(newScale, newScale, newScale);
        this.el.object3D.matrix.compose(this.el.object3D.position,
                                        this.el.object3D.quaternion,
                                        this.el.object3D.scale);

        this.setRadius()
      }
    }
    // update position for next tick.
    this.lastWorldPosition.copy(this.currentWorldPosition);
    this.lastWorldQuaternion.copy(this.currentWorldQuaternion);
  }
});

/* This component is a modified version of:
   https://github.com/caseyyee/aframe-ui-widgets/blob/master/src/rotary.js */
AFRAME.registerComponent('ui-rotary', {

  init: function () {
    var indicator = new THREE.Mesh(new THREE.BoxGeometry( 0.02, 0.08, 0.06 ), new THREE.MeshLambertMaterial({color: 0xff3333}))
    indicator.position.z = -0.08;
    indicator.position.y = 0.02;

    var knob = new THREE.Mesh(new THREE.CylinderGeometry( 0.1, 0.1, 0.1, 20 ), new THREE.MeshLambertMaterial({color: 0x666666}));
    knob.add(indicator);
    knob.position.y = 0.025;
    this.knob = knob;

    var body = new THREE.Mesh(new THREE.CylinderGeometry( 0.12, 0.15, 0.02, 20 ), new THREE.MeshNormalMaterial());
    body.add(knob);

    this.el.setObject3D('mesh', body);

    this.controllers = Array.prototype.slice.call(document.querySelectorAll('a-entity[hand-controls]'));

    this.yAxisDefault = new THREE.Vector3(0, 1, 0);
    this.xAxis = new THREE.Vector3();
    this.yAxis = new THREE.Vector3();
    this.zAxis = new THREE.Vector3();

  },

  play: function () {
    this.grabbed = false;
    this.controllers.forEach(function (controller) {
      controller.addEventListener('gripdown', this.onTriggerDown.bind(this));
      controller.addEventListener('gripup', this.onTriggerUp.bind(this));
    }.bind(this));
  },

  pause: function () {
    this.controllers.forEach(function (controller) {
      controller.removeEventListener('gripdown', this.onTriggerDown.bind(this));
      controller.removeEventListener('gripup', this.onTriggerUp.bind(this));
    }.bind(this));
  },

  onTriggerUp: function () {
    if (this.grabbed) {
      //this.grabbed.visible = true;
      this.grabbed = false;
    }
  },


  onTriggerDown: function (e) {
    var hand = e.target.object3D;
    var knob = this.knob;

    var handBB = new THREE.Box3().setFromObject(hand);
    var knobBB = new THREE.Box3().setFromObject(knob);
    var collision = handBB.intersectsBox(knobBB);

    if (collision) {
      this.grabbed = hand;
      //this.grabbed.visible = false;
    };
  },

  tick: function () {
    if (this.grabbed) {
      var axis = 'x';
      this.grabbed.matrix.extractBasis ( this.xAxis, this.yAxis, this.zAxis);

      var handRotation
      if (this.yAxis.z > 0) {
        handRotation = -this.yAxisDefault.angleTo(this.yAxis);
      }
      else {
        handRotation = this.yAxisDefault.angleTo(this.yAxis);
      }

      //var handRotation = this.grabbed.rotation[axis];
      var deltaChange = !this.lastRotation ? 0 : handRotation - this.lastRotation;
      this.knob.rotation.y += deltaChange;
      if (this.knob.rotation.y >= 0.8 * Math.PI) {
        //console.log("this.knob.rotation >= 0.8 * PI")
        //console.log(this.knob.rotation)
        this.knob.rotation.y = 0.8 * Math.PI;
      }
      if (this.knob.rotation.y <= -0.8 * Math.PI) {
        //console.log("this.knob.rotation <= 0.8 * PI")
        //console.log(this.knob.rotation)
        this.knob.rotation.y = -0.8 * Math.PI;
      }

      const value = 0.5 - (this.knob.rotation.y / (1.6 * Math.PI));

      this.el.emit('change', { value: value});
      this.lastRotation = handRotation;
    } else {
      this.lastRotation = 0;
    }
  }

});

/* This component is a modified version of:
   https://github.com/caseyyee/aframe-ui-widgets/blob/master/src/button.js */
AFRAME.registerComponent('ui-button', {
  schema: {
    size: { type: 'number', default: 0.1 },
    color: { type: 'color', default: '#960960' },
    pressedColor: { type: 'color', default: '#FC2907' },
    baseColor: {type: 'color', default: '#618EFF'},
    topY: { type: 'number', default: 0.02 },
    pressedY: { type: 'number', default: 0.012 },
    base: { type: 'array' },    /* specify mixin for button base */
    top: { type: 'array' },     /* specify mixin for button top */
    pressed: {type: 'array' }   /* add mixin for button when pressed */
  },

  multiple: true,

  init: function () {
    var self = this;
    var top = document.createElement('a-entity');
    if (this.data.top.length > 0) {
      top.setAttribute('mixin', this.data.top.join(' '));
    } else {
      // default style
      top.setAttribute('geometry', {
        primitive: 'cylinder',
        radius: 0.1,
        height: 0.025,
        segmentsHeight: 1
      });
      top.setAttribute('position', { x: 0, y: this.data.topY, z: 0 });
      top.setAttribute('material', { color: this.data.color });
    }
    this.top = top;
    this.el.appendChild(top);

    var base = document.createElement('a-entity');
    if (this.data.base.length > 0) {
      base.setAttribute('mixin', this.data.base.join(' '));
    } else {
      // default style
      base.setAttribute('geometry', {
        primitive: 'cone',
        radiusTop: 0.12,
        radiusBottom: 0.15,
        height: 0.02,
        segmentsHeight: 1
      });
      base.setAttribute('material', { color: this.data.baseColor });
    }
    this.el.appendChild(base);

    var controllers = document.querySelectorAll('a-entity[hand-controls]');
    this.controllers = Array.prototype.slice.call(controllers);

    this.pressed = false;
    this.interval = null;
    this.lastTime = 0;
  },

  play: function () {
    var el = this.el;
    // cursor controls
    el.addEventListener('mousedown', this.onButtonDown.bind(this));
    el.addEventListener('mouseup', this.onButtonUp.bind(this));
    el.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    // motion controls
    el.addEventListener('hit', this.onHit);
    el.addEventListener('touchdown', this.onButtonDown.bind(this));
    el.addEventListener('touchup', this.onButtonUp.bind(this));
  },

  pause: function () {
    var el = this.el;
    el.removeEventListener('mousedown', this.onButtonDown.bind(this));
    el.removeEventListener('mouseup', this.onButtonUp.bind(this));
    el.removeEventListener('mouseleave', this.onButtonUp.bind(this));
    el.removeEventListener('hit', this.onHit);
    el.removeEventListener('touchdown', this.onButtonDown.bind(this));
    el.removeEventListener('touchup', this.onButtonUp.bind(this));
  },

  onButtonDown: function () {
    var top = this.top;
    var el = this.el;
    if (this.data.top.length > 0 && this.data.pressed.length > 0) {
      var mixin = this.data.top.join(' ') + ' ' + this.data.pressed.join(' ');
      top.setAttribute('mixin', mixin);
    } else {
      top.setAttribute('position',{ x: 0, y: this.data.pressedY, z: 0 });
      top.setAttribute('material', { color: this.data.pressedColor });
    }
    this.pressed = true;
    el.emit('buttondown');
  },

  resetButton: function() {
    var top = this.top;
    // top.setAttribute('position',{ x: 0, y: this.topOrigin.y, z: 0});
    if (this.data.top.length > 0) {
      var mixin = this.data.top.join(' ');
      top.setAttribute('mixin', mixin);
    } else {
      top.setAttribute('position', { x: 0, y: this.data.topY, z: 0 });
      top.setAttribute('material', { color: this.data.color });
    }
  },

  onButtonUp: function (e) {
    if (this.pressed) {
      var el = this.el;
      this.resetButton();
      this.pressed = false;
      el.emit('buttonup');
      el.emit('pressed');
    }
  },

  onMouseLeave: function() {
    if (this.pressed) {
      this.resetButton();
      this.pressed = false;
    }
  },

  // handles hand controller collisions
  onHit: function (evt) {
    var threshold = 30;
    if (!this.pressed) {
      this.pressed = true;
      this.emit('touchdown');
      var self = this;
      this.interval = setInterval(function() {
        var delta = performance.now() - self.lastTime;
        if (delta > threshold) {
          self.pressed = false;
          self.lastTime = 0;
          self.emit('touchup');
          clearInterval(self.interval);
        }
      }, threshold);
    }
    this.lastTime = performance.now();
  },

  update: function () {
    this.el.setAttribute('cursor-listener','');
  },

  tick: function () {
    var self = this;
    var mesh = this.top.getObject3D('mesh');
    if (!mesh) {
      console.log('no mesh!');
      return
    }
    var topBB = new THREE.Box3().setFromObject(mesh);
    this.controllers.forEach(function(controller) {
      var controllerBB = new THREE.Box3().setFromObject(controller.object3D);
      var collision = topBB.intersectsBox(controllerBB);

      if (collision) {
        self.el.emit('hit');
      }
    });
  }
});

AFRAME.registerComponent('volume-control', {
  schema: {
    music: {type: 'selector', default: '#music'}
  },

  init() {
    this.el.addEventListener('change', this.onChange.bind(this));
  },

  onChange(event) {
    //console.log(`Change: ${event.detail.value}`)
    this.data.music.setAttribute('volume', event.detail.value);

    this.el.sceneEl.emit("task-change-volume");
  }
});

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


AFRAME.registerComponent('perimeter-fence', {

  schema: {
    radius: {type: 'number', default: 10},
    posts: {type: 'number', default: 50}
  },

  init() {
    for (ii = 0; ii < this.data.posts; ii++) {

        const branch = document.createElement('a-entity');
        branch.setAttribute("mixin", "fence-post");
        branch.setAttribute("cylindrical-position",
                            `height:0.4;
                             radius:${this.data.radius};
                             angle:${ii * 360 / this.data.posts};
                             randomOrientation: true`);
        branch.setAttribute("ammo-shape", "type:hull");
        this.el.appendChild(branch);
    }
  }
});

AFRAME.registerComponent('letters-block', {

  schema: {
    letters: {type: 'string', default: "ABCDEF"},
    color: {type: 'color', default: 'red'},
    letterColor: {type: 'color', default: 'white'}
  },

  init() {

    const dim = 0.3;

    const block = document.createElement('a-box');
    block.setAttribute('height', dim);
    block.setAttribute('width', dim);
    block.setAttribute('depth', dim);
    block.setAttribute('movement', `type:grabbable; stickiness:stickable;
                                    initialState:dynamic; releaseEvent: task-move-alphabet`);
    block.setAttribute("ammo-shape", "type:box");
    block.setAttribute("rotation", `0 ${30 * (Math.random() - 0.5)} 0`);
    block.setAttribute("color", this.data.color);
    this.el.appendChild(block);

    const positions = [
      `0 0 ${dim/2}`,
      `0 0 ${-dim/2}`,
      `0 ${dim/2} 0`,
      `0 ${-dim/2} 0`,
      `${dim/2} 0 0`,
      `${-dim/2} 0 0`,
    ]

    const rotations = [
      "0 0 0",
      "0 -180 0",
      "-90 0 0",
      "90 0 0",
      "0 90 0",
      "0 -90 0"
    ]

    for (ii = 0; ii < 6; ii++) {
        const text = document.createElement('a-text');
        text.setAttribute('value', this.data.letters[ii]);
        text.setAttribute('wrap-count', '2');
        text.setAttribute('color', this.data.letterColor);
        text.setAttribute('width', '0.3');
        text.setAttribute('align', 'center');
        text.setAttribute('position', positions[ii]);
        text.setAttribute('rotation', rotations[ii]);
        block.appendChild(text);
    }
  }
});


AFRAME.registerComponent('task-board', {

  init() {

    this.tasks = [
      {text: "Try to catch a snowflake in your mouth",
       event: "task-catch-snowflake"
     },
     {text: "Move the snowman's nose",
      event: "task-move-nose"
     },
     {text: "Re-arrange the Christmas tree baubles",
      event: "task-move-baubles"
    },
    {text: "Play the icicle xylophone",
     event: "task-xylophone"
    },
    {text: "Roll a bauble down the marble run",
     event: "task-marble-run"
    },
    {text: "Look closely at the reflections in a bauble",
     event: "task-close-look"
    },
    {text: "Make a snowball",
     event: "task-snowball"
    },
    {text: "Make a big snowball",
     event: "task-big-snowball"
    },
    {text: "Re-arrange the marble run",
     event: "task-change-marble-run"
    },
    {text: "Knock down a penguin",
     event: "task-knock-penguin"
    },
    {text: "Make a stack of at least 3 presents",
     event: "task-stack-presents"
    },
    {text: "Turn the music volume up or down",
     event: "task-change-volume"
    },
    {text: "Make a chain of 10 snowballs",
     event: "task-stick-snowballs"
    },
    {text: "Paint 5 snowballs",
     event: "task-paint-snowballs"
    },
    {text: "Move a perimeter fence post",
     event: "task-move-fence-post"
    },
    {text: "Re-arrange the alphabet blocks",
     event: "task-move-alphabet"
    },
    {text: "Paint all the icicles different colors",
     event: "task-paint-icicles"
    },
    {text: "Re-set the bowling alley",
     event: "task-reset-bowling"
    },
    {text: "Make a snow angel",
     event: "task-snow-angel"
    },
    {text: "Get a STRIKE in the bowling alley",
     event: "task-strike-bowling"
    },
    {text: "Hoist the star 10 meters into the air",
     event: "task-high-star"
    },
    {text: "Play 'We wish you a Merry Christmas'",
     event: "task-merry-christmas"
    },
    {text: "Make a 3 foot long carrot!",
     event: "task-large-carrot"
    },
    {text: "Complete all these tasks",
     event: "task-all-tasks"
    },
    ]

    this.taskComplete = this.taskComplete.bind(this);

    this.board = document.createElement('a-box');
    this.board.setAttribute('height', 4);
    this.board.setAttribute('width', 1.5);
    this.board.setAttribute('depth', 0.1);
    this.board.setAttribute('ammo-body', 'type:static');
    this.board.setAttribute('ammo-shape', 'type:box');
    this.board.setAttribute('color', "#5C4033");
    this.el.appendChild(this.board);

    this.text = document.createElement('a-text');
    this.text.setAttribute('color', 'white')
    this.text.setAttribute('width', 1.3)
    this.text.setAttribute('baseline', 'top')
    this.text.setAttribute('white-space', 'pre')
    this.text.object3D.position.set(-0.65, 1.9, 0.05);
    // 100B is unicode blank non-whitespace character.
    const text = this.tasks.reduce((a, task, index) => a + `\n\n\u200B\t\t${index + 1}. ${task.text}`, "");
    const title = "WINTER WONDERLAND ADVENT TASK LIST\n";
    const hints = `\n\nHINTS\n
                   Grip on either hand to grab objects\n
                   Hold grip near the ground to make a snowball\n
                   Left trigger to teleport\n
                   Trigger to activate the magic paintbrush`;
    this.text.setAttribute('value', title + text + hints);
    this.el.appendChild(this.text);

    this.checks = [];

    this.tasks.forEach((task, index) => {
      const check = document.createElement('a-entity');

      check.setAttribute('id', `task-check-${index}`);
      check.object3D.position.set(-0.6, (1.7 - index * 0.12), 0.05);
      check.object3D.scale.set(0.7, 0.7, 0.7);
      check.object3D.visible = false;
      check.setAttribute('instanced-mesh-member', "mesh:#task-check-mesh");
      this.el.appendChild(check);
      this.checks.push(check);

      this.el.sceneEl.addEventListener(task.event, () => this.taskComplete(index));
    })

    this.tasksComplete = 0;
  },

  taskComplete(taskNumber) {
    console.log(taskNumber + " complete");

    if (!this.checks[taskNumber].object3D.visible) {

      this.checks[taskNumber].object3D.visible = true;
      this.checks[taskNumber].emit("object3DUpdated");
      this.tasksComplete++;
    }

    if (this.tasksComplete === 23) {
      this.el.sceneEl.emit("task-all-tasks")
    }

    if (this.tasksComplete === 24) {

      // Party time!  Set board to gold.
      this.board.setAttribute("color", "goldenrod");
      this.board.setAttribute("metalness", 0.7);
      this.board.setAttribute("roughness", 0.3);
      this.board.setAttribute("material", "envMap:#env");

      // play cheers.
      const cheers = document.getElementById("cheers");
      cheers.components['sound'].playSound();

      //spawn trophy.

      if (!this.spawnedTrophy) {
        this.spawnTrophy();
        this.spawnedTrophy = true;
      }
    }
  },

  spawnTrophy() {

    const trophy = document.createElement('a-entity');
    trophy.setAttribute("mixin", "trophy")
    trophy.setAttribute("material", "color:goldenrod;metalness:0.7;roughness:0.3;envMap:#env");
    trophy.setAttribute('movement', "type:grabbable; stickiness:stickable; initialState:dynamic");
    trophy.setAttribute("ammo-shape", "type:hull");
    trophy.object3D.position.set(0, 0.5, 0);

    const playArea = document.getElementById("play-area");

    playArea.appendChild(trophy);
  }
});

AFRAME.registerGeometry('check', {
  schema: {
  },

  init: function (data) {
    //radiusTop, radiusBottom, height, radialSegments
    const geometries = [];
    // 2 cylinders, one tall and thin for the hat, one short and wider for the brim.
    geometries.push(new THREE.BoxGeometry(0.05, 0.05, 0.05));
    geometries.push(new THREE.BoxGeometry(0.15, 0.05, 0.05));
    geometries[1].translate(0.05, -0.05, 0);

    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
    this.geometry.rotateZ(Math.PI/4);

    recenterGeometry(this.geometry);
  }
});

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

AFRAME.registerComponent('camera-event-watcher', {

  init() {
    this.defaultYAxis = new THREE.Vector3(0, 1, 0);
    this.camDir = new THREE.Vector3();
    this.camQ = new THREE.Quaternion();

    this.snowflakeTime = 0;
    this.snowAngelTime = 0;

    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);
  },

  tick(t, dt) {

    var cam = this.el.object3D;
    cam.updateMatrixWorld();
    this.camQ.setFromRotationMatrix(cam.matrixWorld);
    this.camDir.set(0, 0, -1);
    this.camDir.applyQuaternion(this.camQ);

    if (this.camDir.angleTo(this.defaultYAxis) < 0.5) {
      // looking straight up.
      this.snowflakeTime += dt;
    }
    else {
      this.snowflakeTime = 0;
    }

    if (this.el.object3D.position.y < 0.3) {
      // lying on floor - snow angel.
      this.snowAngelTime += dt;
    }
    else {
      this.snowAngelTime = 0;
    }

    if (this.snowAngelTime > 3000) {
      this.el.sceneEl.emit("task-snow-angel");
    }

    if (this.snowflakeTime > 3000) {
      this.el.sceneEl.emit("task-catch-snowflake");
    }
  }
});


AFRAME.registerComponent('detect-bauble', {

  init() {
    this.el.addEventListener('collidestart', this.onCollide.bind(this));
  },

  onCollide(event) {

    if (event.detail.targetEl.hasAttribute('bauble')) {
      this.el.sceneEl.emit("task-marble-run")
    }
  }

});

AFRAME.registerComponent('bauble', {

  init() {

    this.worldPosition = new THREE.Vector3();
    this.distanceToCamera = new THREE.Vector3();
    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);
  },

  tick() {

     this.el.object3D.getWorldPosition(this.worldPosition);
     var cam = this.el.sceneEl.camera.el.object3D;
     cam.updateMatrixWorld();
     this.distanceToCamera.setFromMatrixPosition(cam.matrixWorld);
     this.distanceToCamera.sub(this.worldPosition);

     if (this.distanceToCamera.lengthSq() < 0.1) {
       // approx 30cm from camera.
       this.el.sceneEl.emit("task-close-look");
     }
  }

});

AFRAME.registerComponent('star', {

  init() {

    this.worldPosition = new THREE.Vector3();
    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);
  },

  tick() {

     this.el.object3D.getWorldPosition(this.worldPosition);

     if (this.worldPosition.y > 10) {
        this.el.sceneEl.emit("task-high-star");
     }
  }

});

AFRAME.registerComponent('count-painted-snowballs', {

  init() {
    this.snowballsPainted = 0;
    this.el.sceneEl.addEventListener("snowball-painted", this.snowballPainted.bind(this));
    this.el.sceneEl.addEventListener("icicle-painted", this.iciclePainted.bind(this));
  },

  snowballPainted() {

    this.snowballsPainted++;

    if (this.snowballsPainted === 5) {
      this.el.sceneEl.emit("task-paint-snowballs");
    }
  },

  iciclePainted() {

    const icicles = document.querySelectorAll('[musical-note]');

    const colors = [];

    icicles.forEach((el) => {
      const color = el.getAttribute("material").color;

      if (!colors.includes(color)) {
        colors.push(color);
      }
    })

    if (colors.length >= 8) {
      this.el.sceneEl.emit("task-paint-icicles");
    }
  }
});

AFRAME.registerComponent('carrot-watch', {

  init() {
    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);

    this.worldScale = new THREE.Vector3();
  },

  tick() {

     this.el.object3D.getWorldScale(this.worldScale);
     if (this.worldScale.x > 3) {
       // carrot grew to 3 foot!
       this.el.sceneEl.emit("task-large-carrot")
       this.el.removeAttribute('carrot-watch')
     }
  }

});

AFRAME.registerComponent('tune-detector', {

  init() {
    this.tune = [
      "xC",
      "xF",
      "xF",
      "xG",
      "xF",
      "xE",
      "xD",
      "xD"
    ]

    this.el.sceneEl.addEventListener("music-note", this.hearNote.bind(this));
    this.sequenceNumber = 0;
  },

  hearNote(event) {

    note = event.detail.note;
    if (note === this.tune[this.sequenceNumber]) {

      this.sequenceNumber++;
      if (this.sequenceNumber >= this.tune.length) {
        this.el.sceneEl.emit("task-merry-christmas")
      };
    }
    else {
      // out of sequence.  But maybe 1st note of new sequence.
      if (note === this.tune[0]) {
        this.sequenceNumber = 1;
      }
      else {
        this.sequenceNumber = 0;
      }
    }
  }

});

AFRAME.registerComponent('check-for-present-stack', {

  init() {
    this.presents = document.querySelectorAll('[present]')

    this.tick = AFRAME.utils.throttleTick(this.tick, 500, this);
  },

  tick() {

    var stackCount = 0;

    // look for a & b stacked over each other.
    this.presents.forEach((a) => {

      this.presents.forEach((b) => {
        if (this.presentsStacked(a,b)) {
          stackCount += 1;
        }
      });
    });

    // A stack of 3 presents a, b, c will give us 3 stacked relationships:
    // b over a, c over b & c over a.

    if (stackCount >= 3) {

      this.el.sceneEl.emit("task-stack-presents");
      this.el.removeAttribute("check-for-present-stack");
    }
  },

  presentsStacked(a, b) {
    var top;
    var bottom;

    if (!a.object3D) return;
    if (!b.object3D) return;

    if (a.object3D.position.y > b.object3D.position.y) {
      top = a;
      bottom = b;
    }
    else {
      // not stacked this way round (a over b).
      return;
    }

    const yOffset = top.object3D.position.y - bottom.object3D.position.y;

    // smallest presents are height 0.1
    if (yOffset < 0.09) {
      return false;
    }
    const xOffset = Math.abs(top.object3D.position.x - bottom.object3D.position.x);
    const zOffset = Math.abs(top.object3D.position.z - bottom.object3D.position.z);

    // approximate stacking check.  boxes are roughly cubes, so this is a decent
    // (simple) way of judging whether they are stacked vs. side-by-side.
    if (xOffset < yOffset && zOffset < yOffset) {
      return true;
    }
    else {
      return false;
    }
  }
});
