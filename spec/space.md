# Space

How positions, distances and directions are carried, whichever system carries
them, and what a map gives that nothing on the wire carries.

## Units and axes

Positions and distances are in world units. The ground is the plane of x and
z, and y is height. A field that carries a position on the ground carries x and
z; one that carries a point in the world carries x, y and z. Where a message
leaves height out, a receiving end takes it from the ground beneath.

A position travels as a 32-bit float on each axis, except in the compact paths
of `Movement` and `MovementAtSpeed`, which carry their points as integers
measured from the map's origin. [Movement](movement.md) says how those points
are worked out.

## Directions

A direction is carried as a vector, not as an angle, with one exception below.

- A unit's facing in the movement state `EnterSight` carries is a pair along
  the ground, x and z.
- `UnitStopped`, `MissileState`, a particle's facing and a view's direction in
  `Camera` carry x, y and z.
- `FaceDirection` carries x, y and z, and turns the unit to face along them,
  over the time it gives where its flags say so, and at once otherwise.
- `CreateNeutral` carries a point to face rather than a direction: the monster
  faces from where it stands toward that point, or along +z where the two are
  the same.
- A champion carries no facing of its own when created: it faces as its map's
  table of spawn positions says (see `CreateChampion`).

The exception is a prop of scenery: `MapProp` gives its turn as pitch, yaw and
roll, in degrees, where yaw 0 faces +z and yaw 90 faces +x. An active prop
reads the same three fields as a direction vector.

## Maps

`VersionSync` names the map to load by number. Two maps carry the name
Summoner's Rift and differ, so the number is what identifies a map, and the
name is only a label. What a map holds, and what it gives that nothing on the
wire carries, a client takes from its own data for that map (see [The client's data](data.md)): its buildings
(see [Objects and identifiers](objects.md)), its spawn positions, and the
origin its paths are measured from (see [Movement](movement.md)).

| `map` | Map                  | Origin of its paths |
| ----- | -------------------- | ------------------- |
| 1     | Summoner's Rift      | 6991, 7223          |
| 8     | The Crystal Scar     | 6947, 6609          |
| 10    | The Twisted Treeline | 7708, 7227          |
| 11    | Summoner's Rift      | 7358, 7412          |
| 12    | The Howling Abyss    | 6560, 6309          |
