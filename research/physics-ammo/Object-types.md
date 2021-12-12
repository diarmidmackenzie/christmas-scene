Current status:

- Static objects OK
- Stickable objects OK
- Dynamic non-sticky objects OK
- Sticky dynamic objects not OK - really need reparenting working with physics to manage these in a stable way...
- New throwing physics TBC - not yet tested in VR.



Net steps:

- Maybe move to this codebase & API anyway.  Works for everything in current scene & enables dynamic non-sticky objects.
- Prototype re-parenting with Ammo.js physics *(why doesn't it work?  Can it work?)
- Test how new velocity-on-release throwing physics feels.



Sticky static object

- E.g. snowman's body & arms.
- Just regular static objects with "sticky" attribute



Stickable objects

- E.g. eyes, carrot
- Dynamic objects, moveable by hand
- When positioned overlapping a sticky object , they stick to it.
- They select one sticky parent object as the sticky-parent, and always move with this
- (except when grabbed by a hand.  Hand grabbing dominates over sticky-parent)



Sticky dynamic objects

- Eg. snowball
- Act just like stickable objects...
- But also: stackable objects can stick to them...
- ... and they will stick to stickable objects.



Dynamic objects

- E.g. presents
- Dynamic objects, moveable by hand
- But they don't stick to objects, objects don't stick to them.
- 



Attributes:

- sticky
- stickable
- grabbable 
- static



Marble run = static

Snowman base = sticky, static

Snowman carrot = stickable, grabbable

Present = grabbable

Snowball = sticky, grabbable



So... objects are:

- static, grabbable, or neither (if object doesn't interact with physics at all)
- sticky, stickable, or neither.



Wrapped up in a single component:

movement="type: static | grabbable; stickiness: sticky | stickable | none"

For easy access, "sticky" and "stickable" attributes are set directly on objects by the movement component.

We'll call this rewrite "phase 3" - I want to preserve "phase 2" for demos etc.




For simplicity & consistency, ammo-shape is always defined externally to this component.

