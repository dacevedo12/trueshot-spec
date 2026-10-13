# Movement

A unit is moved by a path: a run of points on the ground plane, the first of
which is where the unit is and the last where it is going. `schema/types` holds
the layout under `Movement`, and this document covers what the layout cannot
say.

Applies to 4.17 and 4.20 clients, as [Versions](versions.md) describes.

## Coordinates

The compact paths of `Movement` and `MovementAtSpeed` carry their points as
integers, while positions elsewhere are world floats covering a far larger
range (see [Space](space.md)). The two are related by an origin
and a step:

```
encoded = truncate_toward_zero((world - origin) / 2)
world   = origin + 2 * encoded
```

The step is two world units, so a path resolves a position to an even multiple
of two from the origin, rounded toward the origin. Nothing recovers what
truncation discards.

A path names one axis of the ground plane and then the other. The height of a
point is not carried, and a receiving end takes it from the ground beneath.

## The origin

The origin is the midpoint of the bounds a map's navigation data covers,
truncated to a whole number on each axis. **Nothing on the wire carries it.**
Both ends hold it before a match begins, and a path is meaningless to an end
that holds a different one: every position it reads lands somewhere else, while
every byte it reads stays valid.

A server MUST take the origin from the map it is hosting. A server MUST NOT
derive the origin from anything a client sent. A client's positions are a claim like any
other, and a server that took an origin from one would let a single client
move the ground under every other.

[Space](space.md) gives the origin of each map, keyed by the map number a
server sends in `VersionSync`. The origin belongs to the map, not to the
protocol. A server hosting a map the
table leaves out takes its origin from that map's navigation data.

## Relocating rather than walking

A movement whose flag says so carries a token beside the unit (see
`Movement`). A receiving end remembers
one token for each unit, beginning at zero.

A token unlike the remembered one puts the unit where the path begins rather
than walking it there, but only where the unit is far enough away to warrant
it. Far enough is measured on each ground axis on its own rather than as a
distance: either axis differing by more than fifty world units puts the unit,
and fifty exactly does not. Height is not weighed. Where the unit goes is where the path
begins, since nothing else carries a destination.

A token the receiving end already holds changes nothing, and neither does an
unfamiliar one arriving while the unit is near enough. In both the path is
followed as it stands and the remembered token is left alone, so a token is
taken up only once it has moved something.

A client leaves the flag clear in what it sends, so a token travels only
from a server.

A client answers every group of movements it takes in, naming the group and
listing the units the group asked it to relocate along with the tokens that
did it. It lists every movement in the group that carried a token, whether or
not the token moved anything, and it answers a group that asked for no
relocation with an empty list. One answer covers a whole group rather than one
movement. A server MAY ignore the answer.

## Other shapes

The layout `schema/types` records as `Movement` is the compact one, where a
path is a run of points each stated against the one before it.
`MovementAtSpeed` carries the same points with the terms of the travel stated
before them, and `WaypointGroupAtSpeed` is what carries it. A unit coming into
sight while standing carries its place and facing in `EnterSight` instead.
Other messages carry their points as world floats, and their definitions say
so. Which shape a payload holds is settled by the message carrying it
rather than by anything inside the movement, so a reader never chooses.

A sending end MUST NOT send a movement with no points; a receiving end refuses
it.

## Resolving a path

A path is read into points by taking the first as it stands and then, for each
point after it, taking each coordinate either as it stands or by adding the
step to the coordinate of the point before. The point before means as that
point resolved, not what the wire carried for it, which matters wherever a
coordinate stated afresh is followed by one stated as a step.

`conformance/vectors/algorithm` records the resolution of the paths the
movement vectors carry. Those vectors hold fields a decoder has already read
and what they resolve to, and touch no bytes.

## What a client asks for and what a server answers

A client sends the path it would take. A server is under no obligation to
accept it: a path arriving from a client is a request, and what a unit does is
whatever the server sends back. The destination a client asks for also arrives
as world floats beside the path.

A client does not move its own champion on a right click by itself: the
champion moves only along a `WaypointGroup` a server sends. To move it, a
server MUST answer the `MoveOrder` with a `WaypointGroup` on the transient
channel, and the client returns that group's `syncId` in a `WaypointAck` (see
[Ordering](ordering.md)). A
`WaypointGroup` carrying back the path the order brought, unchanged, moves the
champion along the route the client proposed.

## Marking the ground

`NavigationFlags` marks the ground within circles. A server MUST NOT send `NavigationFlags` to a 4.17
client: such a client fails on the first one a match brings.

## Messages

<!-- messages:begin -->

| Message                                                                | Sent by | 4.17            | 4.20            | What it does                                                                                                                           |
| ---------------------------------------------------------------------- | ------- | --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [`DrawPath`](../schema/messages/DrawPath.json)                         | client  | 262 on requests | none            | What a client sends as its player draws a path with the right mouse button, once a server has turned drawing on (DrawPathMode)         |
| [`DrawPathMode`](../schema/messages/DrawPathMode.json)                 | server  | 261 on events   | none            | What a server sends its player's champion to have the player draw paths with the mouse                                                 |
| [`FaceDirection`](../schema/messages/FaceDirection.json)               | server  | 80 on events    | 80 on events    | Turn a unit to face a direction                                                                                                        |
| [`MoveOrder`](../schema/messages/MoveOrder.json)                       | client  | 114 on requests | 114 on requests | Tell a server what it wants a unit to do                                                                                               |
| [`MovementBounds`](../schema/messages/MovementBounds.json)             | server  | 6 on events     | 6 on events     | Keep its champion's orders within a circle                                                                                             |
| [`NavigationFlags`](../schema/messages/NavigationFlags.json)           | server  | 65 on events    | none            | Mark the ground within circles, in place of the circles it marked before: each circle's flags apply to the ground within it            |
| [`Path`](../schema/messages/Path.json)                                 | server  | 185 on events   | none            | Set a unit walking along a path, facing the way it walks                                                                               |
| [`PathWithSpeed`](../schema/messages/PathWithSpeed.json)               | server  | 131 on events   | none            | Set a unit moving along a path at a speed of its own, perhaps in an arc or following another unit                                      |
| [`UnitLookAt`](../schema/messages/UnitLookAt.json)                     | server  | 271 on events   | 271 on events   | Turn a unit toward something                                                                                                           |
| [`UnitStopped`](../schema/messages/UnitStopped.json)                   | server  | 49 on events    | none            | Stop a unit where it stands                                                                                                            |
| [`WaypointAck`](../schema/messages/WaypointAck.json)                   | client  | 119 on requests | 119 on requests | What a client sends once it has taken in a group of movements, naming which group and listing the units the group asked it to relocate |
| [`WaypointGroup`](../schema/messages/WaypointGroup.json)               | server  | 97 on transient | 97 on transient | Move units                                                                                                                             |
| [`WaypointGroupAtSpeed`](../schema/messages/WaypointGroupAtSpeed.json) | server  | 100 on events   | 100 on events   | Move units along paths of its own choosing, stating how each one travels rather than leaving it to the receiving end                   |

<!-- messages:end -->
