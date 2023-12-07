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
