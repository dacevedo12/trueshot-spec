# Movement

A unit is moved by a path: a run of points on the ground plane, the first of
which is where the unit is and the last where it is going.

## Coordinates

A path names one axis of the ground plane and then the other. The height of a
point is not carried, and a receiving end takes it from the ground beneath.

<!-- holds from 0.8.13.26 up to 1.0.0.81 -->

> **In 0.8.13.26–1.0.0.80**
>
> A path carries each point as two world floats (see [Space](space.md)),
> stated against no origin and no other point.

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, each stated against the one before it, while positions elsewhere are
> world floats covering a far larger range (see [Space](space.md)). The two are
> related by an origin and a step:
>
> ```
> encoded = truncate_toward_zero((world - origin) / 2)
> world   = origin + 2 * encoded
> ```
>
> A path resolves a position to two world units, rounded toward the origin.

## Other shapes

`MovementAtSpeed` carries the same points as `Movement` with the terms of the
travel stated before them, and `WaypointGroupAtSpeed` is what carries it. Other
messages carry their points as world floats, and their definitions say so. The
message carrying a movement says which shape it holds.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client reads nothing of `EnterSight`.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> A unit coming into sight while standing carries its place and facing in
> `EnterSight` instead.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A champion or minion coming into sight while standing carries its place and
> facing in `EnterSight` instead. Other units carry no place there.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A unit coming into sight while standing carries its place and facing in
> `EnterSight` instead.

## Resolving a path

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> A path is read into points by taking the first as it stands and then, for
> each point after it, taking each coordinate either as it stands or by adding
> the step to the coordinate of the point before. The point before means as
> that point resolved, not what the wire carried for it, which matters wherever
> a coordinate stated afresh is followed by one stated as a step.

`conformance/vectors/algorithm` records the resolution of the paths the
movement vectors carry. They give decoded fields and the points they resolve
to.

## What a group can carry

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A movement with no points empties the unit's path.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> A sending end MUST NOT send a movement with no points; a receiving end
> refuses it.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> A client reads nothing after a refused movement in its group, and still
> answers the group.

<!-- holds from 1.0.0.96 up to 1.0.0.141 -->

> **In 1.0.0.96–1.0.0.140**
>
> A client does not read the points of a movement whose unit it does not hold,
> and so misreads every later movement in the group. A server MUST name in a
> group only units the client holds.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client reads the points of a movement whose unit it does not hold, and keeps
> them for when the unit appears (see [Objects and identifiers](objects.md)).

## The origin

<!-- holds from 0.8.13.26 up to 1.0.0.61 -->

> **In 0.8.13.26–1.0.0.60**
>
> A server needs no origin.

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> The origin is the midpoint of the bounds a map's navigation data covers,
> truncated to a whole number on each axis. **Nothing on the wire carries it.**
> Both ends hold it before a match begins, and an end holding a different one
> misplaces every position it reads.
>
> A server MUST take the origin from the map it is hosting. A server MUST NOT
> derive the origin from anything a client sent.
>
> [Space](space.md) gives the origin of each map, keyed by the map number a
> server sends in `VersionSync`. A server hosting a map the table leaves out
> takes its origin from that map's navigation data.

## Relocating rather than walking

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

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> A movement whose flag says so carries a token beside the unit (see
> `Movement`). A receiving end remembers one token for each unit, beginning at
> zero.
>
> A token unlike the remembered one puts the unit where the path begins rather
> than walking it there, but only where the unit is far enough away to warrant
> it: either ground axis differing by more than fifty world units, taken on its
> own. Fifty exactly does not, and height is not weighed.
>
> A token the receiving end already holds changes nothing, and neither does an
> unfamiliar one arriving while the unit is near enough. In both the path is
> followed and the remembered token kept, so a token is taken up only once it
> has moved something.
>
> A client leaves the flag clear in what it sends, so a token travels only from
> a server.

## What a client asks for and what a server answers

An order from a client is a request: what a unit does is whatever the server
sends back.

A client does not move its own champion on a right click by itself: the
champion moves only along a path a server sends.

<!-- holds from 0.8.13.26 up to 1.0.0.63 -->

> **In 0.8.13.26–1.0.0.62**
>
> An order carries no path: only its destination, in world floats. A server
> works out the route itself and sends it in the path that answers the order.

<!-- holds from 0.9.22.14 up to 4.21.0.0 -->

> **In 0.9.22.14–4.20**
>
> A server moves the champion by answering the `MoveOrder` with a
> `WaypointGroup`, and the client returns that group's `syncId` in a
> `WaypointAck` (see [Ordering](ordering.md)).

<!-- holds from 0.9.25.24 up to 1.0.0.127 -->

> **In 0.9.25.24–1.0.0.126**
>
> A client takes a `WaypointGroup` or a `WaypointGroupAtSpeed` on channels 2, 3
> and 4 alike.

<!-- holds from 0.9.25.24 up to 1.0.0.61 -->

> **In 0.9.25.24–1.0.0.60**
>
> A client sends the `WaypointAck` before reading any movement in the group,
> and lists no units in it.

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> A client sends the path it would take, with its destination beside it in
> world floats. A `WaypointGroup` carrying that path back unchanged moves the
> champion along it.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A server MUST send the `WaypointGroup` that answers a `MoveOrder` on the
> transient channel.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client takes a `WaypointGroup` or a `WaypointGroupAtSpeed` on channels 2, 3
> and 4 alike.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A server MUST send the `WaypointGroup` that answers a `MoveOrder` on the
> transient channel.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Where its player has movement prediction on, a client starts its champion
> toward the point it asked for, and puts it back where it was if no path
> arrives within 2 seconds. A path carried by `WaypointGroupAtSpeed` cannot be
> overridden by the player's orders, so a server walks a champion with
> `WaypointGroup`.

## Marking the ground

`NavigationFlags` marks the ground within circles.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A server MAY send `NavigationFlags`. A client replaces the circles it holds
> with those it carries, and answers with its `syncId`.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A server MUST NOT send `NavigationFlags`: a client fails on the first one a
> match brings.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A server MAY send `NavigationFlags`. Once the map's ground grid is loaded, a
> client replaces the circles it holds with those it carries, and answers with
> its `syncId`; before then it takes nothing and does not answer.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A server MUST NOT send `NavigationFlags`: a client fails on the first one a
> match brings.

<!-- messages -->
