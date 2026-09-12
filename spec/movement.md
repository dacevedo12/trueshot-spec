# Movement

A unit is moved by a path: a run of points on the ground plane, the first of
which is where the unit is and the last where it is going. `schema/types` holds
the layout under `Movement`, and this document covers what the layout cannot
say.

## Coordinates

A path carries its points as pairs of sixteen bit signed integers, while
positions elsewhere are pairs of thirty two bit floats covering a far larger
range. The two are related by an origin and a step:

```
encoded = truncate_toward_zero((world - origin) / 2)
world   = origin + 2 * encoded
```

The step is two world units, so a path resolves a position to the nearer even
multiple of two from the origin. Nothing recovers what truncation discards.

A path names one axis of the ground plane and then the other. The height of a
point is not carried, and a receiving end takes it from the ground beneath.

## The origin

The origin is the midpoint of the bounds a map's navigation data covers,
truncated to a whole number on each axis. **Nothing on the wire carries it.**
Both ends hold it before a match begins, and a path is meaningless to an end
that holds a different one: every position it reads lands somewhere else, while
every byte it reads stays valid.

A server MUST take the origin from the map it is hosting, and MUST NOT derive
it from anything a client sent. A client's positions are a claim like any
other, and a server that took an origin from one would let a single client
move the ground under every other.

The origins this document records, keyed by the map number a server sends in
`VersionSync`:

| `map` | Map                  | Origin     |
| ----- | -------------------- | ---------- |
| 1     | Summoner's Rift      | 6991, 7223 |
| 8     | The Crystal Scar     | 6947, 6609 |
| 10    | The Twisted Treeline | 7708, 7227 |
| 11    | Summoner's Rift      | 7358, 7412 |
| 12    | The Howling Abyss    | 6560, 6309 |

Two maps carry the name Summoner's Rift and their origins differ, so the number
is what identifies a map here and the name is only a label.

Each pair was established by observation rather than from any map: a movement
order carries where it is going as world floats and also as a path, so each
order that reaches its destination pins the origin to a window two units wide.
Each pair was taken from a session on that map, and each session carried its
map number, so every pair is tied to the number a server sends rather than to
a name.

On each map the recorded pair fits more of the captured orders than any
neighbouring whole number on either axis, counting only the orders that carry a destination: 10 of 10 on map 8, 9 of 9 on map 11, 9 of 10 on map 12, 6 of 7 on map 1, and 5 of 6 on map 10. No map's pair fits a single
one of any other map's orders, which is what shows the origin belongs to the
map rather than to the protocol.

> [!NOTE]
> These are the five maps the captures behind this specification were taken
> on. A server hosting another takes its origin from that map's navigation
> data, as the start of this section says.

## Relocating rather than walking

A movement sometimes carries a token beside the unit. A receiving end remembers
one token for each unit, beginning at zero.

A token unlike the remembered one puts the unit where the path begins rather
than walking it there, but only where the unit is far enough away to warrant
it. Far enough is measured on each ground axis on its own rather than as a
distance: either axis differing by more than fifty puts the unit, and fifty
exactly does not. Height is not weighed. Where the unit goes is where the path
begins, since nothing else carries a destination.

A token the receiving end already holds changes nothing, and neither does an
unfamiliar one arriving while the unit is near enough. In both the path is
followed as it stands and the remembered token is left alone, so a token is
taken up only once it has moved something.

A client leaves the flag clear in everything it sends, so a token travels only
from a server.

A client answers every group of movements it takes in, naming the group and
listing the units the group asked it to relocate along with the tokens that
did it. It lists every movement in the group that carried a token, whether or
not the token moved anything, and it answers a group that asked for no
relocation with an empty list. One answer covers a whole group rather than one
movement. Nothing on a client waits on that answer, so a server that ignores it
changes nothing a client does.

## Other shapes

The layout `schema/types` records as `Movement` is the compact one, where a
path is a run of points each stated against the one before it.
`MovementAtSpeed` carries the same points with the terms of the travel stated
before them, and `WaypointGroupAtSpeed` is what carries it. A unit coming into
sight while standing carries its place and facing in `EnterSight` instead.
Messages carrying their points as world floats rather than compactly exist and
are not recorded here. Which shape a payload holds is settled by the message carrying it
rather than by anything inside the movement, so a reader never chooses.

A count of no points is not a movement a receiving end accepts. It reads the
count, refuses the record, and takes nothing further from it.

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
whatever the server sends back. The destination a client asks for arrives as
world floats beside the path, so a server that computes its own route reads
those and ignores the rest.
