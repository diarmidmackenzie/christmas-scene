AFRAME.registerComponent('networking', {

  init() {

    this.el.setAttribute('networked-scene', 
                         `serverURL: air-hockey-naf-server.glitch.me;
                          room: ${ROOM_KEY};
                          adapter: wseasyrtc`)
  }
})