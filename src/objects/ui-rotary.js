/* This component is a modified version of:
   https://github.com/caseyyee/aframe-ui-widgets/blob/master/src/rotary.js */
   AFRAME.registerComponent('ui-rotary', {

    init: function () {
      var indicator = new THREE.Mesh(new THREE.BoxGeometry( 0.02, 0.08, 0.06 ), new THREE.MeshLambertMaterial({color: 0xff3333}))
      indicator.position.z = -0.08;
      indicator.position.y = 0.02;
  
      var knob = new THREE.Mesh(new THREE.CylinderGeometry( 0.1, 0.1, 0.1, 20 ), new THREE.MeshLambertMaterial({color: 0x666666}));
      knob.add(indicator);
      knob.position.y = 0.025;
      this.knob = knob;
  
      var body = new THREE.Mesh(new THREE.CylinderGeometry( 0.12, 0.15, 0.02, 20 ), new THREE.MeshNormalMaterial());
      body.add(knob);
  
      this.el.setObject3D('mesh', body);
  
      this.controllers = Array.prototype.slice.call(document.querySelectorAll('a-entity[hand-controls]'));
  
      this.yAxisDefault = new THREE.Vector3(0, 1, 0);
      this.xAxis = new THREE.Vector3();
      this.yAxis = new THREE.Vector3();
      this.zAxis = new THREE.Vector3();
  
    },
  
    play: function () {
      this.grabbed = false;
      this.controllers.forEach(function (controller) {
        controller.addEventListener('gripdown', this.onTriggerDown.bind(this));
        controller.addEventListener('gripup', this.onTriggerUp.bind(this));
      }.bind(this));
    },
  
    pause: function () {
      this.controllers.forEach(function (controller) {
        controller.removeEventListener('gripdown', this.onTriggerDown.bind(this));
        controller.removeEventListener('gripup', this.onTriggerUp.bind(this));
      }.bind(this));
    },
  
    onTriggerUp: function () {
      if (this.grabbed) {
        //this.grabbed.visible = true;
        this.grabbed = false;
      }
    },
  
  
    onTriggerDown: function (e) {
      var hand = e.target.object3D;
      var knob = this.knob;
  
      var handBB = new THREE.Box3().setFromObject(hand);
      var knobBB = new THREE.Box3().setFromObject(knob);
      var collision = handBB.intersectsBox(knobBB);
  
      if (collision) {
        this.grabbed = hand;
        //this.grabbed.visible = false;
      };
    },
  
    tick: function () {
      if (this.grabbed) {
        var axis = 'x';
        this.grabbed.matrix.extractBasis ( this.xAxis, this.yAxis, this.zAxis);
  
        var handRotation
        if (this.yAxis.z > 0) {
          handRotation = -this.yAxisDefault.angleTo(this.yAxis);
        }
        else {
          handRotation = this.yAxisDefault.angleTo(this.yAxis);
        }
  
        //var handRotation = this.grabbed.rotation[axis];
        var deltaChange = !this.lastRotation ? 0 : handRotation - this.lastRotation;
        this.knob.rotation.y += deltaChange;
        if (this.knob.rotation.y >= 0.8 * Math.PI) {
          //console.log("this.knob.rotation >= 0.8 * PI")
          //console.log(this.knob.rotation)
          this.knob.rotation.y = 0.8 * Math.PI;
        }
        if (this.knob.rotation.y <= -0.8 * Math.PI) {
          //console.log("this.knob.rotation <= 0.8 * PI")
          //console.log(this.knob.rotation)
          this.knob.rotation.y = -0.8 * Math.PI;
        }
  
        const value = 0.5 - (this.knob.rotation.y / (1.6 * Math.PI));
  
        this.el.emit('change', { value: value});
        this.lastRotation = handRotation;
      } else {
        this.lastRotation = 0;
      }
    }
  
  });
  