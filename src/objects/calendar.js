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
