

### Physics performance in my "Winter Wonderland" Christmas Scene as of 20/12/2021

Methodology:

- Create modified HTML file with only selected scene elements
- Start scene up, leave for ~20 seconds to "stabilize"
- Logging records physics tick averaged over 100 ticks - observe these in Chrome debugger.
- I eyeball 5-10 of these logs and pick out a rough average.
- Might have been a good idea to record variance too, but I didn't.  In general variance was higher on desktop and lower on Oculus Quest 2, which is unsurprising as the desktop was running a load of other applications and browser tabs at the same time.

Rationale for measuring in idle state.

- Although an idle scene is less demanding than a test involving dynamic physical interactions, it is much easier to reliably reproduce, and also decently representative of performance - the scene contains many isolated elements, so even when the user is being highly interactive, most of them will be idle most of the time.

Data below shows the physics tick time in msecs for scnese comprising various subsets of objects.

All scenes also include: Floor Plane: 1 x static box

|                              | Contains                                                     | Desktop      | Oculus Quest 2 |
| ---------------------------- | ------------------------------------------------------------ | ------------ | -------------- |
| Full scene (21/12)           | 17 x static shapes (including floor), 34 kinematic convex shapes, 10 x dynamic convex hulls, 1 x HACD hollow hat. | 42           | 26             |
| Snowman only                 | 2 x  static spheres, 7 x kinematic spheres, 3 x kinematic convex hulls (carrot + 2 x arms) 1 x kinematic HACD hollow hat | 17           | 6.5            |
| Tree and presents only       | 3 x static hulls, 9 x kinematic spheres, 1 x kinematic convex hull (star) | 14           | 3.7            |
| Xylophone                    | 5 x static boxes, 8 x kinematic convex hulls                 | 4            | 1.15           |
| Marble run                   | 3 x static boxes, 6 x kinematic boxes                        | 2.5          | 0.5            |
| Bowling Alley                | 3 x static boxes, 10 x dynamic convex hulls                  | 18           | 5              |
| SUM OF COMPONENTS            | See "full scene" above.                                      | 55.5 (vs 42) | 16.85 (vs. 26) |
| Snowman without HACD hat     | 2 x  static spheres, 7 x kinematic spheres, 3 x kinematic hulls (carrot + 2 x arms) | 4            | 1.5            |
| Implied cost of HACD hat     | 1 x kinematic HACD hollow hat.  HOWEVER, cost of HACD hat appears to be *higher* in the context of the whole scene.... see next row... | 13           | 5              |
| Total scene without HACD hat | See "full scene" above.                                      | 25           | 11.5           |

Implied approx cost of each element:

- HACD hollow hat: Up to 15msecs
- Dynamic shapes: 0.5msecs
- Kinetic shapes: 0.2 to 0.3 msecs
- Static shapes: < 0.1msecs



Target for 60fps is to use substantially less than 16 msecs (ideally < 10msecs, as we need CPU for other functions as well).



Unknowns:

- Non-linearity - why do values on desktop add up to more than the total, whereas on Oculus Quest 2 they add up to (substantially) less than the total?
  - Seems to be substantially influenced by non-linearity associated with the HACD hat.
  - Without this, numbers seem to roughly add up on Oculus Quest 2
  - Not clear why we don't see such a negative non-linear effect on desktop, but desktop numbers are less reliable as I'm testing with a bunch of other applications running, so it's a much less controlled environment.



Implications:

- To achieve 60fps on Oculus Quest, the hollow snowman's hat has to go.  It uses almost our entire physics budget up just on its own!
  - Possible solution might be to make it square in shape (vs. currently a 10-sided approximation of a circle)
  - Plausibly that would cut the cost to 2/5ths...
- The fact that most objects are "stuck" and hence kinetic, most of the time, is beneficial for physics performance.  Maybe 40-50% less cost than equivalent dynamic objects.
  - Hooray for sticky snow!
- Nothing else (other than reducing overall scene complexity) is likely to make much difference - e.g. modelling penguins as cylinders rather than convex hulls is unlikely to move the needle very far at all.



### Some more notes on HACD snowman's hat

Looking at overall scene physics ttick time on Oculus Quest 2...

- Reducing hat geometry from 10 sides to 4 sides, with HACD gets us from 26msecs to ~18msecs.
- Making the hat 10 sided, non-hollow, with HACD also gets ups to ~18 msecs (since the brim sticks out, HACD still has a bunch of work to do for the outside of the hat)
- Making the hat 10-sides non-hollow with a convex hull shape gets us down to ~12 msecs.

I don't really care about the non-convex exterior of the hull.  A convex wrap would be fine for that.  But I would like the hat to still have a hollow interior.

- Not sure whether that can be achieved...  Segmenting the hat into a set of radial segments, each given a convex wrap, and kept rigidly in formation with parent-child relationships, would work as long as the object is kinematic, but things will fall apart badly as soon as all those objects become dynamic.

- A hat without a brim might be a lot simpler...

- Or maybe I could have the brim as a separate child object that is decorative only, with no collision physics on it (like I have done with the ribbons on the presents)...

  



Further update on the HACD hat...

- After adding 50 fence posts around the perimeter of the scene, the impact of the HACD hat has become much worse.
  - Without the HACD hat, physics tick processing is now ~9msecs (yes, it's gone down as a result of adding more physics objects, that doesn't make much sense but it seems to have hapened)
  - With the HACD hat, physics tick processing is now ~35msecs (way up vs. before).
- So the HACD hat has to go.
  - One idea I have had is to have the hat track its orientation, and switch from hull shape to HACD shape only when upside down.  If I can make the switchover clean, that might get me the best of both worlds...