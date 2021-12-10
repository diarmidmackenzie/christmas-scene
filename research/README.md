### Physics Notes (Ammo.js)

Why Ammo.js?

I chose Ammo.js as the physics engine for my Christmas scene on the basis that:

- It's supported by A-frame physics system, which I've used before with some success.
- In part experience, I have found Ammo.js to perform better, and with fewer weird effects than Cannon.js (the other option in A-Frame physics system)
- I'm also aware of PhysX from NVidia, and the work that Zach Capalbo has done to wrap this up for easy use within A-Frame as part of his Vartiste project https://gitlab.com/zach-geek/vartiste - but given time constraints, I didn't want to risk using a completely unfamiliar physics system.  

So I decided to start out with Ammo,js, and pivot if I hit insurmountable problems.

#### Phase 1

Initially, I wanted a coupe of basic capabilities:

- I wanted to be able to put items in place on a snowman
- But when removed from the snowman, I wanted them to drop to the floor, rather than float in the air.

Ammo offers 3 types of object: static, kinetic & dynamic.

- The snowman's body was an obvious static object.

- But what about the carrot coals etc.?

  - I wanted them to be static so they would fall to the floor when I let go of them.

  - Dynamic objects can be handled via constraints to a kinetic object attached to the hand (tis is how superhands works)

  - But dynamic objects weren't a perfect fit...

    - I wanted to be able to embed items in the snowman's face.  But you can't overlap a dynamic object with a static object - as soon as you let physics act on it, it will leap away with great force.
    - Fixing the dynamic objects to the face didn't give the effect I wanted.  They tended to bounce around the point of constraint, rather than being fixed in place, like what happens when you jam a carrot into a snowman's face!

  - Kinetic objects had many of the atributes I wanted...

    - Constraints don't work on kinetic objects, but kinetic objects' positions can be manipulated directly, so I can keep the kinetic object position & rotation aligned with the hand that holds it on a tick()
      - (potentially this could also be done by reparenting the object3D to the hand/controller - but I tried this and it seemed to cause a lot of problems with the physics engine, so I dropped this idea)
    - Kinetic objects sit where you put them, which is great when they are in place on the snowman, but not so good when you drop them in the air.

  - So I decided what I ideally wanted was for these objects to be:

    - Kinetic when embedded in the snowman's face.
    - Kinetic when handled (so they could be pushed into a static object)
    - Dynamic when released (so they would drop to the floor)

  - However, I hit lots of problems wit Ammo.js when switching objects between dynamic and kinetic...

    - Objects created as kinetic never act as dynamic, even when later configured as dynamic.
    - Changing objects from dynamic to kinetic seemed to cause them to stop reporting collisions (more on this later...)
    - I didn't seem to be heading to a viable solution, so I put this plan on hold...

  - ...and came up with my actual implementation for phase 1:

    - Objects are always kinetic
    - On release, I applied a very simple custom gravity routine on a tick().
    - On release, I also gave objects velocity & rotation to match their movement immediately prior to release - this managed to give some pretty realistic throwing physics.

    

Here's a simple 2D demo of phase 1 physics.

https://diarmidmackenzie.github.io/christmas-scene/research/physics-ammo/move-objects.html

I find this kind of 2D keyboard controlled setup much easier for debugging problems than the full 3D VR scene.



#### Phase 2

As I developed the scene, I was getting frustrated by the limitations of the phase 1 physics.

In particular, because there is no real physics on released objects (apart from some very simple gravity), we can't do things like rolling objects down ramps etc.

Also, although I could add additional dynamic objects to the scene (subject to the constraint they couldn't be attached to the snowman), dropped kinetic objects would not interact with them, and would just fall through them.



So I looked back at switching between kinetic & dynamic objects in Ammo.js, and found that although there did seem to be some pretty serious bugs, I could find acceptable workarounds for them.

The result is here:

https://diarmidmackenzie.github.io/christmas-scene/research/physics-ammo/dynamic-kinematic-switch.html



Fully functional switching back & forth between kinetic & dynamic ammo bodies!



The two key bugs I had to workaround were:

- If they are ever to be dynamic, objects must be dynamic when physics starts on the scene.
- The first time a dynamic object is switched kinetic, the Ammo body in the physics system (though not the visible mesh itself) continues to be processed as a dynamic object (this explains why, earlier, I'd not been getting the collision events I expected!)

Once understood, these problems are pretty easy to work around.

This code in the init() function solves both problems...

```
this.el.addEventListener("body-loaded", () => {
  setTimeout(() => {
    this.el.setAttribute('ammo-body', 'type:kinematic');
    this.el.setAttribute('ammo-body', 'type:dynamic');
    this.el.setAttribute('ammo-body', 'type:kinematic');
  }, 1);
});

```

A 1 msec timeout is sufficient for the physics system to process the body as dynamic for one physics cycle.

Switching to kinematic twice is enough to flush out the bug where switching to kinematic doesn't work the first time.  No additional delays / timeouts are needed here.

I expect that both of these bugs can be fixed within A-Frame physics system itself (will raise issues shortly), but it's convenient to be able to work with a published release, and the workarounds are not too onerous.

On the basis of this workaround, I'm now planning to move to an updated (phase 2) physics system.

Objects that can be affixed to the snowman are:

- Kinetic when embedded in the snowman's face.
- Kinetic when handled (so they can be pushed into a static object)
- Manipulated by tick-based sync to controller position (this is the only viable way to manipulate a kinetic object, since constraints don't work with kinetic objects)
- Dynamic when released (so they drop to the floor, and engage in other physics interactions, as required)

> Demo of this updated system coming soon...



I'm expecting to also create another class of object which is:

- Always dynamic
- Manipulated via constraints.
- Can't be pushed into the snowman...
- ... but interact with proper physics with other dynamic objects, and also with kinetic objects such as those affixed to the snowman.

This might be a good fit for objects like Xmas presents, where it makes less sense to want to be able to affix them to a snowman, and it might be nicer if they fell off in these circumstances.

- Snowman's hat might be better handled in this category.  Right now it's a bit weird that you can jam the hat brim into the snowman's belly and it just stays there...

  

#### Other notes

Problems seen when changing object3D parent, as a way of attaching kinetic objects to the hand / controller.

- breaks scale is scale not-zero.
- Breaks if parent of object is the scene (optimization in ammo-physics based on assumption that El parent is object parent)
- Breaks detection of next collisionend (for anything that was collided at the time).  Not sure why, yet.

Other ways I tried to switch between kinetic & dynamic - neither worked at all well!

- Entirely removing and re-adding the ammo-body component
- Cloning the entire entity, but with new required body-type, and destroying the old one (the Angier method) 



I did briefly look at Cannon.js.  A-Frame physics system didn't give me the level of collision info I needed, but the direct Cannon.js API would probably have met my needs.  I was hesitant to go further along this path because I've seen Cannon.js deliver some fairly unrealistic physics simulation in the past.

I haven't yet got around to looking at PhysX/Vartiste.  With the progress now made with Ammo.js, I don't expect that I will for this project...
