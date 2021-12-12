

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



We'll call this rewrite "phase 3" - I want to preserve "phase 2" for demos etc.




For simplicity & consistency, ammo-shape is always defined externally to this component.

