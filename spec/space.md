# Space

How positions, distances and directions are carried, whichever system carries
them, and what a map gives that nothing on the wire carries.

## Units and axes

Positions and distances are in world units. The ground is the plane of x and
z, and y is height. A field that carries a position on the ground carries x and
z; one that carries a point in the world carries x, y and z. Where a message
leaves height out, a receiving end takes it from the ground beneath.

A position travels as a 32-bit float on each axis unless its definition says
otherwise. Where the paths of `Movement` and `MovementAtSpeed` are compact,
they carry their points as integers measured from the map's origin, and
[Movement](movement.md) says how those points are worked out.

## Directions

A direction is carried as a vector, not as an angle:

- A unit's facing in the movement state `EnterSight` carries is a pair along
  the ground, x and z.
- Where `UnitStopped`, `MissileState`, a particle or a view report in `Camera`
  carries a direction, it carries x, y and z.
- `FaceDirection` carries x, y and z.

<!-- holds from 0.8.13.26 up to 3.11.0.306 -->

> **In 0.8.13.26–3.10**
>
> `FaceDirection` turns the unit along x and z alone, and leaves it as it is
> where both are 0.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> `Camera` carries no direction: it carries the point the view looks at, where
> the view stands plus 2000 units the way it faces.

<!-- holds from 1.0.0.140 up to 3.11.0.306 -->

> **In 1.0.0.140–3.10**
>
> `FaceDirection` turns the unit at once where bit 0 of its flags is clear, and
> toward that direction at its own pace where it is set.

<!-- holds from 4.4.0.1858 up to 4.5.0.260 -->

> **In 4.4**
>
> `FaceDirection` turns the unit over the time it gives where its flags say
> so, and at once otherwise.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> `FaceDirection` turns the unit over the time it gives where its flags say
> so, and at once otherwise.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> `FaceDirection` turns the unit over the time it gives where its flags say
> so, and at once otherwise.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> `FaceDirection` turns the unit along x and z alone, and leaves it as it is
> where both are 0.

A champion carries no facing of its own when created.
[The client's data](data.md#what-a-server-reads) says where it begins, and
which way it faces where it sets one.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A champion is created facing +z, whatever its map's table of spawn positions
> says, and so is a monster.

<!-- holds from 1.0.0.104 up to 4.18.0.271 -->

> **In 1.0.0.104–4.17**
>
> `CreateNeutral` carries a point to face rather than a direction: the monster
> faces from where it stands toward that point, or along +z where the two are
> the same.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> `CreateNeutral` carries a point to face rather than a direction: the monster
> faces from where it stands toward that point, or along +z where the two are
> the same.

<!-- holds from 1.0.0.110 up to 1.0.0.111 -->

> **In 1.0.0.110**
>
> `MapProp` carries a prop of scenery's position only, with no angles and no
> direction.

<!-- holds from 1.0.0.124 up to 4.21.0.0 -->

> **In 1.0.0.124–4.20**
>
> A prop of scenery carries angles instead: `MapProp` gives its turn as pitch,
> yaw and roll, in degrees, where yaw 0 faces +z and yaw 90 faces +x. For an
> active prop, the same three fields are a direction vector.

## Maps

A client takes a map's buildings (see [Objects and identifiers](objects.md)) and
spawn positions from its own data (see [The client's data](data.md)), and can
load only a map it has data for. A compact path takes its origin from the same
data (see [Movement](movement.md)).

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> `VersionSync`'s `map` names the map to load by number.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client loads the map its own game configuration names under the key
> `Mission` of the section `Hacks`, `Map1` where that is absent, and has data
> for map 1 alone, Summoner's Rift.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A client has data for maps 1, 2 and 3.

<!-- holds from 1.0.0.25 up to 1.0.0.97 -->

> **In 1.0.0.25–1.0.0.96**
>
> A client has data for maps 1 to 4.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> | `map` | Origin of its paths |
> | ----- | ------------------- |
> | 1     | 6991, 7223          |
> | 2     | 6991, 7223          |
> | 3     | 7479, 7147          |
> | 4     | 6710, 6696          |

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client has data for maps 1 to 4 and 8:
>
> | `map` | Origin of its paths |
> | ----- | ------------------- |
> | 1     | 6991, 7223          |
> | 2     | 6991, 7223          |
> | 3     | 7479, 7147          |
> | 4     | 6710, 6696          |
> | 8     | 6947, 6609          |

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client has data for maps 1 to 4, 6 and 8:
>
> | `map` | Origin of its paths |
> | ----- | ------------------- |
> | 1     | 6991, 7223          |
> | 2     | 6991, 7223          |
> | 3     | 7479, 7147          |
> | 4     | 6710, 6696          |
> | 6     | 6991, 7223          |
> | 8     | 6947, 6609          |

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> The maps a client has data for include these:
>
> | `map` | Map                  | Origin of its paths |
> | ----- | -------------------- | ------------------- |
> | 1     | Summoner's Rift      | 6991, 7223          |
> | 8     | The Crystal Scar     | 6947, 6609          |
> | 10    | The Twisted Treeline | 7708, 7227          |
> | 12    | The Howling Abyss    | 6560, 6309          |

<!-- holds from 3.10.0.237 up to 3.14.0.700 -->

> **In 3.10–3.13**
>
> A client has no data for map 11.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client has no data for map 11.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A client also has data for map 11, a second Summoner's Rift, whose paths
> have their origin at 7358, 7412.
