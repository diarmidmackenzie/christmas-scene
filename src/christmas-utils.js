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

AFRAME.registerComponent('penguin', {

  init () {
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
    this.el.addEventListener('collidestart', this.onCollide.bind(this));
  },

  onCollide() {

    // we stop before playing, to allow for the same not to play twice
    // in a row, quickly.
    this.el.components['sound'].stopSound();
    this.el.components['sound'].playSound();
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

  init() {
    this.el.addEventListener('collidestart', this.onCollide.bind(this));
    this.color = new THREE.Color();
  },

  onCollide(event) {

    const targetEl = event.detail.targetEl;

    if (!targetEl || !targetEl.hasAttribute('paintbrush')) return;

    const color = targetEl.components['paintbrush'].color;

    this.el.setAttribute('material', `color: #${this.snowColor(color).getHexString()}`);
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
        branch.setAttribute("mixin", "branch");
        branch.setAttribute('scale', "0.3 0.3 0.3")
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
