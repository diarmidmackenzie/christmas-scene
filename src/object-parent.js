// mouse-manipulation includes a version of `object-parent`, which we need to override.
delete(AFRAME.components['object-parent'])

// Change the parent of an object
AFRAME.registerComponent('object-parent', {

  schema: {
      parentId:        {type: 'string'},
      parentNetworkId: {type: 'string'},
      position:   {type: 'string', oneOf: ['absolute', 'relative'], default: 'absolute'}
  },

  update() {

    if (!this.data.parentId && !this.data.parentNetworkId) {
      // specifying no parent is equivalent to removing the component.
      // This is needed for NAF, which doesn't replicate removal of attributes in a schema,
      // but only changes to the property values of an attibute.
      this.remove()
      return
    }

    // parentNetworkId takes precedence over parentId
    let newParentEl
    if (this.data.parentNetworkId) {
      //console.log(this.data.parentNetworkId)
      newParentEl = NAF.entities.entities[this.data.parentNetworkId]
      if (!newParentEl) {
        // race condition where parent gets replicated after the child that refers to it.
        document.body.addEventListener('entityCreated', (e) => {
          const newEl = e.detail.el
          if (newEl.components.networked.data.networkId === this.data.parentNetworkId) {
            console.assert(NAF.entities.entities[this.data.parentNetworkId])
            this.update()
          }
        })
        return
      }
    }
    else {
      const parentId = this.data.parentId
      const matches = document.querySelectorAll(`#${parentId}`)
      if (matches.length > 1) {
          console.warn(`object-parent matches duplicate entities for new parent ${parent.id}`)
      }
      newParentEl = document.getElementById(parentId)
    }

    const newParent = newParentEl.object3D


    if (this.isMyDescendant(newParent)) {
      // parenting an object to one of its descendents creates an infinite stack loop.
      console.warn("Error: request received to parent object to it's own descendant")
      console.warn(`Object: ${this.el.id}; requested parent: ${newParentEl.id}`)
      console.warn("This object: ", this.el.object3D)
      console.warn("Requested parent object: ", newParent)
      return;
    }

    this.reparent(newParent)

    const networkId = newParentEl.components?.networked?.data?.networkId

    if (networkId) {
      this.el.setAttribute('object-parent', `parentNetworkId: ${networkId}`)
    }
    else if (!newParentEl.hasLoaded){
      // race condition where child is initialized before the parent it refers to.
      newParentEl.addEventListener('loaded', () => this.update(), {once: true})
    }
  },

  remove() {

    const originalParentEl = this.el.parentEl
    this.reparent(originalParentEl.object3D)

  },

  reparent(newParent) {

    const object = this.el.object3D
    const oldParent = object.parent

    if (object.parent === newParent) {
        return;
    }

    objectEl = (o) => {
        if (o.type === 'Scene') {
            return (this.el.sceneEl)
        }
        else {
            return o.el
        }
    }

    //console.log(`Reparenting ${object.el.id} from ${objectEl(oldParent).id} to ${objectEl(newParent).id}`);
    if (this.data.position === 'absolute') {
      newParent.attach(object);
    }
    else {
      newParent.add(object);
    }

    // Clear Lerp buffer to remove out-dated position information.
    if (this.el.components.networked) {
      this.el.components.networked.removeLerp();
    }
  },

  isMyDescendant(object) {
    if (!object.parent) return false;
    if (object.parent === this.el.object3D) return true;

    return (this.isMyDescendant(object.parent));
  }
});