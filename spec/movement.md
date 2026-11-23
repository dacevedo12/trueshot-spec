# Movement

A unit is moved by a path: a run of points on the ground plane, the first of
which is where the unit is and the last where it is going.

## Coordinates

A path names one axis of the ground plane and then the other, and carries no
height (see [Space](space.md)).

<!-- holds from 0.8.13.26 up to 1.0.0.81 -->

> **In 0.8.13.26–1.0.0.80**
>
> A path carries each point as two world floats (see [Space](space.md)),
> stated against no origin and no other point.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, while positions elsewhere are world floats covering a far larger range
> (see [Space](space.md)). The two are related by an origin and a step:
>
> ```
> encoded = truncate_toward_zero((world - origin) / 2)
> world   = origin + 2 * encoded
> ```
>
> A path resolves a position to two world units, rounded toward the origin.
>
> A path that arrives before a client has loaded the map's ground grid is read
> with a step of 1 in place of 2.

<!-- holds from 1.0.0.110 up to 1.0.0.111 -->

> **In 1.0.0.110**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, while positions elsewhere are world floats covering a far larger range
> (see [Space](space.md)). The two are related by an origin and a step:
>
> ```
> encoded = truncate_toward_zero((world - origin) / 2)
> world   = origin + 2 * encoded
> ```
>
> A path resolves a position to two world units, rounded toward the origin.
>
> Until a client has loaded the map's ground grid, the step is 1 in place of 2
> and the origin 0, both for the paths it reads and for those it sends.

<!-- holds from 1.0.0.111 up to 1.0.0.132 -->

> **In 1.0.0.111–1.0.0.131**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, while positions elsewhere are world floats covering a far larger range
> (see [Space](space.md)). The two are related by an origin and a step:
>
> ```
> encoded = truncate_toward_zero((world - origin) / 2)
> world   = origin + 2 * encoded
> ```
>
> A path resolves a position to two world units, rounded toward the origin.

<!-- holds from 1.0.0.132 up to 1.0.0.133 -->

> **In 1.0.0.132**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, while positions elsewhere are world floats covering a far larger range
> (see [Space](space.md)). The two are related by an origin and a step:
>
> ```
> encoded = truncate_toward_zero((world - origin) / 2)
> world   = origin + 2 * encoded
> ```
>
> A path resolves a position to two world units, rounded toward the origin.
>
> A path that arrives before a client has loaded the map's ground grid is read
> with a step of 1 in place of 2 and an origin of 0.

<!-- holds from 1.0.0.133 up to 1.0.0.150 -->

> **In 1.0.0.133–1.0.0.149**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, while positions elsewhere are world floats covering a far larger range
> (see [Space](space.md)). The two are related by an origin and a step:
>
> ```
> encoded = truncate_toward_zero((world - origin) / 2)
> world   = origin + 2 * encoded
> ```
>
> A path resolves a position to two world units, rounded toward the origin.

<!-- holds from 1.0.0.150 up to 1.0.0.151 -->

> **In 1.0.0.150**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, while positions elsewhere are world floats covering a far larger range
> (see [Space](space.md)). The two are related by an origin and a step:
>
> ```
> encoded = truncate_toward_zero((world - origin) / 2)
> world   = origin + 2 * encoded
> ```
>
> A path resolves a position to two world units, rounded toward the origin.
>
> A path that arrives before a client has loaded the map's ground grid is read
> with a step of 1 in place of 2.

<!-- holds from 3.03.0.198 up to 3.04.0.78 -->

> **In 3.03**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, while positions elsewhere are world floats covering a far larger range
> (see [Space](space.md)). The two are related by an origin and a step:
>
> ```
> encoded = truncate_toward_zero((world - origin) / 2)
> world   = origin + 2 * encoded
> ```
>
> A path resolves a position to two world units, rounded toward the origin.
>
> A path that arrives before a client has loaded the map's ground grid is read
> with a step of 1 in place of 2 and an origin of 0.

<!-- holds from 3.04.0.78 up to 4.21.0.0 -->

> **In 3.04–4.20**
>
> `Movement` and `MovementAtSpeed` are compact: a path is a run of integer
> points, while positions elsewhere are world floats covering a far larger range
> (see [Space](space.md)). The two are related by an origin and a step:
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
messages carry their points as world floats. [Vision](vision.md) says when
`EnterSight` states a unit's path, or its place and facing while it stands.

## Resolving a path

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> A path is read into points by taking the first as it stands and then, for
> each point after it, taking each coordinate either as it stands or by adding
> the step to the coordinate of the point before. The point before means as
> that point resolved, not what the wire carried for it.

`conformance/vectors/algorithm` records paths and the points they resolve to.

## What a group can carry

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A movement with no points empties the unit's path.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> A server MUST NOT send a movement with no points; a client refuses it.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> A client reads nothing after a refused movement in its group, and still
> answers the group.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client takes nothing from the movements after a refused one in the same
> message.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A client also refuses a movement with 128 points or more. It reads nothing
> after a refused movement in its group, and still answers the group.

[Objects and identifiers](objects.md#messages-about-objects-a-client-does-not-hold)
says what a client does with a movement whose unit it does not hold.

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
> A server MUST take the origin from the map it is hosting.
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

<!-- holds from 1.0.0.86 up to 1.0.0.87 -->

> **In 1.0.0.86**
>
> A client answers each group with one `WaypointAck`, listing each unit whose
> movement carried a token, in the order the group gives them, whether or not
> the client holds the unit, and none whose movement follows a refused one; the
> list is empty where it names none. A server MAY ignore it.

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> A movement whose flag says so carries a token beside the unit (see
> `Movement`). A receiving end remembers one token for each unit, beginning at
> zero.
>
> A token unlike the remembered one puts the unit where the path begins rather
> than walking it there, where either ground axis differs by more than fifty
> world units, taken on its own. Fifty exactly does not, and height is not
> weighed.
>
> A token the receiving end already holds changes nothing, and neither does an
> unfamiliar one arriving while the unit is near enough. In both the path is
> followed and the remembered token kept, so a token is taken up only once it
> has moved something.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> A client answers each group with one `WaypointAck`, listing each unit whose
> movement carried a token, in the order the group gives them, whether or not
> the client holds the unit, and none whose movement follows a refused one; the
> list is empty where it names none. A server MAY ignore it.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client answers each group with one `WaypointAck`, listing each unit whose
> movement carried a token, in the order the group gives them, whether or not
> the client holds the unit, and none whose movement follows a refused one; the
> list is empty where it names none. A server MAY ignore it.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client answers each group with one `WaypointAck`, listing each unit whose
> movement carried a token, in the order the group gives them, whether or not
> the client holds the unit, and none whose movement follows a refused one; the
> list is empty where it names none. A server MAY ignore it.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client answers each group with one `WaypointAck`, listing each unit whose
> movement carried a token, in the order the group gives them, whether or not
> the client holds the unit, and none whose movement follows a refused one; the
> list is empty where it names none. A server MAY ignore it.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> A client answers each group with one `WaypointAck`, listing each unit whose
> movement carried a token, in the order the group gives them, whether or not
> the client holds the unit, and none whose movement follows a refused one; the
> list is empty where it names none. A server MAY ignore it.

<!-- holds from 3.14.0.700 up to 4.21.0.0 -->

> **In 3.14–4.20**
>
> A client answers each group with one `WaypointAck`, listing every unit in it
> that carried a token, with an empty list where none did. A server MAY ignore
> it.

<!-- holds from 1.0.0.126 up to 3.11.0.306 -->

> **In 1.0.0.126–3.10**
>
> The `WaypointAck` a client sends for a `Path` or `PathWithSpeed` lists no
> units but leaves its count of units unset, so a server MUST NOT rely on the
> count.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> The `WaypointAck` a client sends for a `Path` or `PathWithSpeed` lists no
> units and carries a count of 0.
>
> A group's `WaypointAck` lists each unit whose movement carried a token, in
> the order the group gives them, whether or not the client holds the unit,
> and none whose movement follows a refused one.

## What a client asks for and what a server answers

An order from a client is a request: what a unit does is whatever the server
sends back.

Unless its player has movement prediction on, a client does not move its own
champion on a right click by itself: the champion moves only along a path a
server sends.

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

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client takes a `WaypointGroup` or a `WaypointGroupAtSpeed` on channels 2, 3
> and 4 alike.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Where its player has movement prediction on, a client starts its champion
> toward the point it asked for, and puts it back where it was if no path
> arrives within 2 seconds. A path carried by `WaypointGroupAtSpeed` cannot be
> overridden by the player's orders.

## Marking the ground

`NavigationFlags` marks the ground within circles.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A server MAY send `NavigationFlags`. Once its navigation grid exists, a client
> replaces the circles it holds with those it carries, and answers with its
> `syncId`; before then it takes nothing and does not answer.

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
