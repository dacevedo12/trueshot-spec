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

## What a champion's groups carry

The table below is what a champion answers to. Every row was read from
captured runs where the group named exactly one value, so the bytes behind each
row are a value on its own rather than a share of a longer run.

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
greatest holds still, and what a spell costs takes one of two values.

A bit this table does not name is a bit no captured run carried on its own. It
is not a bit that means nothing.

## What other units carry

A turret, a unit belonging to no side and a prop each answer to a table of
their own, and the same bit carries something else on each. Group 1 bit 11 is
one already recorded: on a champion it is how fast health returns, and on a
turret it climbs by fours across a match, which health returning does not do.

No table for those kinds is recorded here. What has been read of them is that
they differ, which is enough to say that a sending end MUST NOT write a
champion's table for a unit that is not one.
