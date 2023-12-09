// Workaround for not-yet-understood heisenbug where 
// local control of avatar is lost.

AFRAME.registerComponent('keep-control', {
  tick() {
    if (!NAF.utils.isMine(this.el)) {
      NAF.utils.takeOwnership(this.el)
    }
  }
})
