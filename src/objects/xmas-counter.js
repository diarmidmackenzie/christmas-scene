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
