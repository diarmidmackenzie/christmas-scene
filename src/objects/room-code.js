AFRAME.registerComponent('room-code', {
  schema: {
    width: {type: 'number', default: 0.6},
    height: {type: 'number', default: 0.3},
    depth: {type: 'number', default: 0.1}
  },

  init() {

    this.box = document.createElement('a-box');
    this.box.setAttribute('height', this.data.height);
    this.box.setAttribute('width', this.data.width);
    this.box.setAttribute('depth', this.data.depth);
    this.box.setAttribute('color', '#88f');
    this.box.setAttribute('movement', 'type:static;stickness:none');
    this.box.setAttribute('ammo-shape', 'type:box');
    this.el.appendChild(this.box);

    this.code = document.createElement('a-text');
    this.code.setAttribute('width', this.data.width);
    this.code.setAttribute('align', 'center');
    this.code.setAttribute('wrap-count', 5);
    this.code.setAttribute('value', ROOM_KEY);
    this.code.setAttribute('color', 'black');
    this.code.object3D.position.y = -this.data.height / 12;
    this.code.object3D.position.z = this.data.depth / 2;
    this.box.appendChild(this.code);

    this.caption = document.createElement('a-text');
    this.caption.setAttribute('width', this.data.width);
    this.caption.setAttribute('align', 'center');
    this.caption.setAttribute('wrap-count', 25);
    this.caption.setAttribute('value', "Multiplayer connection code");
    this.caption.setAttribute('color', 'black');
    this.caption.object3D.position.y = this.data.height / 3;
    this.caption.object3D.position.z = this.data.depth / 2;
    this.box.appendChild(this.caption);

  }
});
