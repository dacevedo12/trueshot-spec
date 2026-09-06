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

The origins this document records, by the map each belongs to:

| Map                                                      | Origin     |
| -------------------------------------------------------- | ---------- |
| Summoner's Rift, in the shape it takes in these versions | 7358, 7412 |
| Summoner's Rift, in the shape it took before that        | 6991, 7223 |
| The Crystal Scar                                         | 6947, 6609 |

Each pair was established by observation rather than from any map: a movement
order carries where it is going as world floats and also as a path, so each
order that reaches its destination pins the origin to a window two units wide.
Between twenty four and forty five orders on each map agree on the pair
recorded for it, while the neighbouring whole numbers fit about half as many,
which is what an origin off by one looks like. No map's pair fits any other
map's orders at all.

> [!NOTE]
> Three maps are recorded. A server hosting another needs that map's origin, and
> the paragraph above says how to obtain one.

## What a client asks for and what a server answers

A client sends the path it would take. A server is under no obligation to
accept it: a path arriving from a client is a request, and what a unit does is
whatever the server sends back. The destination a client asks for arrives as
world floats beside the path, so a server that computes its own route reads
those and ignores the rest.
