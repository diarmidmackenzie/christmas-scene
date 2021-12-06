Hope to tidy this up in future - just some v. rough notes for now.



### Physics Notes (Ammo.js)



Constraints don't work on kinetic objects.

Dynamic objects don't seem to trigger collisions after d->k->d...  Is that also true of kinetics?

Dynamic objects can't happily intersect with static objects = physics interferes.

Can't do collisions with non-static objects.

Gravity doesn't operate on kinetics...




Implies best solution:

Start: kinetic object, embedded in static.
Grabbed: add parent/child relationship (hoping that works!)

Released: 

- if intersects sticky object, keep kinetic, parent back to world.
- if no sticky object intersection, switch to dynamic, parent back to world.





Changing parent...

- breaks scale is scale not-zero.
- Breaks if parent of object is the scene (optimization in ammo-physics based on assumption that El parent is object parent)
- Breaks detection of next collisionend (for anything that was collided at the time).  Not sure why, yet.




Concern: picking up a dropped dynamic object - does that work?
Concern: Can it then detect collisions with sticky objects, in order to become stuck into them again?



Believe known:

- constraints only work on dynamic objects
- and dynamic objects can't intersect with static objects (as needed to put stuff into the snowman.

What is still unknown...?

1. Why does changing parent interfere with collision detection?
2. What's actually going wrong when we shift from kinematic to dynamic & vice versa?  Appears that collisions are dropped... but maybe that's because we are removing ammo body completely - so of course we lose track of collisions.  Maybe just changing from dynamic to kinematic wouldn't be a problem?  (if we weren't losing track of collisions due to reparenting).
3. When we spot a collision on dropping the carrot, why don't we also spot the end of the collision as it falls?  And why does it jump position on re-parenting?  Neither actually makes much sense...  Guess both a reparenting-related.
4. Would a different physics engine be better?


Solutions:

- completely recreate the carrot on grab & on release.  It *should* pick up intersections & work correctly...
- don't reparent - just implement a manual tick constraint...

