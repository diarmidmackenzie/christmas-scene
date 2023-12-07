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
        branch.setAttribute("networked", `networked=template:#object-template;
                                          persistent: true;
                                          networkId: post-${ii};
                                          owner: scene`);
        this.el.appendChild(branch);
    }
  }
});
