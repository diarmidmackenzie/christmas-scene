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
