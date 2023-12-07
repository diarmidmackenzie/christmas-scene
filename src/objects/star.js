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