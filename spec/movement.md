# Movement

A unit is moved by a path: a run of points on the ground plane, the first of
which is where the unit is and the last where it is going.

## Coordinates

The compact paths of `Movement` and `MovementAtSpeed` carry their points as
integers, while positions elsewhere are world floats covering a far larger
range (see [Space](space.md)). The two are related by an origin and a step:

```
encoded = truncate_toward_zero((world - origin) / 2)
world   = origin + 2 * encoded
```

A path resolves a position to two world units, rounded toward the origin.

A path names one axis of the ground plane and then the other. The height of a
point is not carried, and a receiving end takes it from the ground beneath.

## Other shapes

The layout `schema/types` records as `Movement` is the compact one, where a
path is a run of points each stated against the one before it.
`MovementAtSpeed` carries the same points with the terms of the travel stated
before them, and `WaypointGroupAtSpeed` is what carries it. A unit coming into
sight while standing carries its place and facing in `EnterSight` instead.
Other messages carry their points as world floats, and their definitions say
so. The message carrying a movement says which shape it holds.

## Resolving a path

A path is read into points by taking the first as it stands and then, for each
point after it, taking each coordinate either as it stands or by adding the
step to the coordinate of the point before. The point before means as that
point resolved, not what the wire carried for it, which matters wherever a
coordinate stated afresh is followed by one stated as a step.

A sending end MUST NOT send a movement with no points; a receiving end refuses
it.

`conformance/vectors/algorithm` records the resolution of the paths the
movement vectors carry. They give decoded fields and the points they resolve
to.

## The origin

The origin is the midpoint of the bounds a map's navigation data covers,
truncated to a whole number on each axis. **Nothing on the wire carries it.**
Both ends hold it before a match begins, and a path is meaningless to an end
that holds a different one: every position it reads lands somewhere else.

A server MUST take the origin from the map it is hosting. A server MUST NOT
derive the origin from anything a client sent.

[Space](space.md) gives the origin of each map, keyed by the map number a
server sends in `VersionSync`. A server hosting a map the table leaves out
takes its origin from that map's navigation data.

## Relocating rather than walking

A movement whose flag says so carries a token beside the unit (see
`Movement`). A receiving end remembers one token for each unit, beginning at
zero.

A token unlike the remembered one puts the unit where the path begins rather
than walking it there, but only where the unit is far enough away to warrant
it. Far enough is measured on each ground axis on its own rather than as a
distance: either axis differing by more than fifty world units puts the unit,
and fifty exactly does not. Height is not weighed. Where the unit goes is where
the path begins, since nothing else carries a destination.

A token the receiving end already holds changes nothing, and neither does an
unfamiliar one arriving while the unit is near enough. In both the path is
followed as it stands and the remembered token is left alone, so a token is
taken up only once it has moved something.

A client leaves the flag clear in what it sends, so a token travels only from a
server.

<!-- holds from 0.8.13.26 up to 1.0.0.61 -->

> **In 0.8.13.26–1.0.0.60**
>
> A path carries no flag and no token, so nothing relocates a unit: every path
> is walked.

<!-- holds from 1.0.0.79 up to 4.21.0.0 -->

> **In 1.0.0.79–4.20**
>
> A client answers each group with one `WaypointAck`, listing every unit in it
> that carried a token, with an empty list where none did. A server MAY ignore
> it.

## What a client asks for and what a server answers

A client sends the path it would take. A server is under no obligation to
accept it: a path arriving from a client is a request, and what a unit does is
whatever the server sends back. The destination a client asks for also arrives
as world floats beside the path.

A client does not move its own champion on a right click by itself: the
champion moves only along a path a server sends.

<!-- holds from 0.9.22.14 up to 4.21.0.0 -->

> **In 0.9.22.14–4.20**
>
> To move it, a server MUST answer the `MoveOrder` with a `WaypointGroup` on the
> transient channel, and the client returns that group's `syncId` in a
> `WaypointAck` (see [Ordering](ordering.md)). A `WaypointGroup` carrying back
> the path the order brought, unchanged, moves the champion along the route the
> client proposed.

<!-- holds from 0.8.13.26 up to 1.0.0.63 -->

> **In 0.8.13.26–1.0.0.62**
>
> An order carries no path: only its destination, in world floats. A server
> works out the route itself and sends it in the path that answers the order.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Where its player has movement prediction on, a client starts its champion
> toward the point it asked for, and puts it back where it was if no path
> arrives within 2 seconds. A path carried by `WaypointGroupAtSpeed` cannot be
> overridden by the player's orders, so a server walks a champion with
> `WaypointGroup`.

## Marking the ground

`NavigationFlags` marks the ground within circles. A server MUST NOT send
`NavigationFlags`: a client fails on the first one a match brings.

<!-- messages -->
