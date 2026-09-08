# Replication

The most frequent thing a server sends is a statement of what has changed about
the units a client can see. `schema/messages/Replication.json` records its
shape: a name for the batch, a count of units, and for each unit a flag byte of
groups, its own name, and for every group named a set of values it carries, the
length of the run holding them, and the run itself.

That much a layout reaches. What the run holds it does not, and this document
says why, what settles it, and what has been read out of it.

## What settles a reading

A run is a sequence of values with nothing between them, in the order the set
bits name them, lowest first. Each value takes one of the two shapes
[spec/messages.md](messages.md) records, and which shape a value takes is not
on the wire.

The bit that names a value means different things for different units. A
champion, a turret, a unit belonging to no side and a prop each answer to their
own table, so the same bit in the same group is one value on one unit and
another on the next. A receiving end knows the table because it made the unit,
from the message that put the unit on the field and the names that message
carried. A sending end MUST write the table the unit it names answers to.

The kind of unit does not always settle it on its own. One kind is recorded as
moving where its current and greatest resource sit between two groups according
to a flag it carries, so a table is chosen by what a unit is and how it was
made.

Nothing on the wire carries a table, a field name, or a width. An end that does
not already hold the table cannot read a run, and this specification does not
supply one it has not seen used.

## How these tables were read

Both shapes a value takes say where they end: a measure by its first byte, a
count by the top bit of each byte. So a run carrying one value gives that
value's shape outright, and a run carrying several gives it wherever one
assignment of shapes to the bits, and only one, consumes the run exactly across
every payload that carried the same set. Everything below was read that way,
from a server a client accepted.

A shape is what a reading end needs to take a run apart. A meaning is what it
needs to act on one. The two tables are separate because the first is settled
by far more of the traffic than the second.

## What a champion's groups carry

| Group | Bit | Value                                            | Shape    |
| ----- | --- | ------------------------------------------------ | -------- |
| 0     | 0   | Gold in hand                                     | measured |
| 0     | 2   | Which spells are ready to cast, as a set of bits | counted  |
| 0     | 8   | What a spell costs to cast                       | measured |
| 1     | 11  | How fast health returns                          | measured |
| 3     | 0   | Health now                                       | measured |
| 3     | 1   | Resource now                                     | measured |
| 3     | 3   | Resource at its greatest                         | measured |
| 3     | 4   | Experience                                       | measured |
| 3     | 10  | How fast the champion moves                      | measured |

Gold in hand is the surest of these. One champion's value climbs by exactly
0.95 a step across a match, which is what a champion earns for standing still,
and another's falls by 35 in one step, which is what an item costs. Health now,
resource now and experience each climb the way those climb, resource at its
greatest holds still, and what a spell costs takes one of three values.

## Shapes settled where the meaning is not

A reading end can take these apart without knowing what they are.

| Unit                      | Group | Bit | Shape    |
| ------------------------- | ----- | --- | -------- |
| Champion                  | 1     | 9   | measured |
| Champion                  | 1     | 10  | measured |
| Champion                  | 2     | 0   | measured |
| Champion                  | 2     | 1   | measured |
| Turret                    | 1     | 8   | measured |
| Turret                    | 1     | 11  | measured |
| Turret                    | 3     | 0   | measured |
| Turret                    | 3     | 1   | measured |
| Turret                    | 3     | 4   | measured |
| Turret                    | 3     | 5   | measured |
| Unit belonging to no side | 1     | 0   | measured |

A bit no table above names is a bit no run settled, either because none carried
it or because more than one assignment of shapes fitted the ones that did. It
is not a bit that means nothing.

## What other units carry

A turret, a unit belonging to no side and a prop each answer to a table of
their own, and the same bit carries something else on each. Group 1 bit 11 is
one already recorded: on a champion it is how fast health returns, and on a
turret it climbs by fours across a match, which health returning does not do.
Group 3 bits 0 and 1 are another: on a champion they are health and resource as
they stand, and on a turret they hold the same values as each other.

No meaning is recorded for those kinds. What has been read of them is that they
differ, which is enough to say that a sending end MUST NOT write a champion's
table for a unit that is not one.
