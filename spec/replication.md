# Replication

The most frequent thing a server sends is a statement of what has changed about
the units a client can see. `schema/messages/Replication.json` records its
shape: a name for the batch, a count of units, and for each unit a flag byte of
groups, its own name, and for every group named a set of values it carries, the
length of the run holding them, and the run itself.

That much a layout reaches. What the run holds it does not, and this document
says what settles it.

## What settles a reading

A run is a sequence of values with nothing between them, in the order the set
bits name them, lowest first. Each value takes one of the two shapes
[spec/messages.md](messages.md) records, and which shape a value takes is not
on the wire.

The bit that names a value means different things for different units. A
champion, a turret, a prop and a unit belonging to no side each answer to their
own table, so the same bit in the same group is one value on one unit and
another on the next. A receiving end knows the table because it made the unit,
from the message that put the unit on the field and the names that message
carried. A sending end MUST write the table the unit it names answers to, and
MUST NOT write one unit's table for another.

The kind of unit does not always settle it. A unit belonging to no side keeps
its resource in one of two places, and which one moves every bit after it, so a
table is chosen by what a unit is and by how it was made.

Nothing on the wire carries a table, a field name, or a width. An end that does
not already hold the table cannot read a run.

## How far these tables are checked

Every table below was run against every replicated value in the captures behind
this specification: 632,549 runs, each taken apart by the shapes its table
gives and each ending exactly where its length says. None failed, and none was
left over.

That checks the shapes, because a wrong shape runs off the end of a run or
stops short of it. It does not check the names. A name below is confirmed only
where the traffic bears it out, and those are marked.

## A champion

| Group | Bits             | Value                                                                  | Shape    |
| ----- | ---------------- | ---------------------------------------------------------------------- | -------- |
| 0     | 0                | Gold in hand, confirmed                                                | measured |
| 0     | 1                | Gold earned in all                                                     | measured |
| 0     | 2 to 3           | Which spells are ready to cast, as sets of bits                        | counted  |
| 0     | 4                | Points held for growing a spell                                        | counted  |
| 0     | 5                | Which spells have grown                                                | counted  |
| 0     | 6 to 7           | Nothing observed                                                       | measured |
| 0     | 8 to 27          | What the spell in one slot costs, confirmed                            | measured |
| 1     | 0 to 4           | What the champion is doing, and four kinds of harm it is proof against | counted  |
| 1     | 5                | Damage it deals by striking, confirmed                                 | measured |
| 1     | 9                | Armour, confirmed                                                      | measured |
| 1     | 10               | Spell resistance                                                       | measured |
| 1     | 11 to 12         | How fast health and resource return                                    | measured |
| 1     | 13               | How far it strikes from, confirmed                                     | measured |
| 1     | 6 to 8, 14 to 31 | The modifiers on damage, defence, speed and reach                      | measured |
| 2     | 0 to 1           | How much armour and spell resistance it cuts through                   | measured |
| 3     | 0 to 1           | Health and resource as they stand, confirmed                           | measured |
| 3     | 2 to 3           | Health and resource at their greatest, confirmed                       | measured |
| 3     | 4                | Experience, confirmed                                                  | measured |
| 3     | 5 to 9           | Lifetime and how far the champion sees                                 | measured |
| 3     | 10               | How fast it moves, confirmed                                           | measured |
| 3     | 11 to 12         | Its size, and how wide a path it needs                                 | measured |
| 3     | 13               | Level, confirmed                                                       | counted  |
| 3     | 14 to 16         | Kills taken from no side, and whether anything is allowed to aim at it | counted  |

A name marked confirmed is one a champion's own numbers bear out.

Gold in hand climbs by exactly 0.95 a step across a match, which is what a
champion earns for standing still, and falls by 35 in one step, which is what
an item costs. Health and resource as they stand climb the way those climb, and
each opens at the value its own greatest carries. Level reads 1 and then 6, and
experience 0, then 2400, then 2602, across the same session.

Spell costs are keyed by slot: bit 8 carries what the spell in slot 0 costs,
bit 9 slot 1, and so on up the run. A session settles this outright. Six times
a client asked to grow a spell, a server answered naming the slot and its new
rank, and two payloads later one cost changed and no other. The slots asked for
were 0, 3, 1, 2, 0 and 1, and the bits that moved were 8, 11, 9, 10, 8 and 9,
in that order. The values behaved as a champion's costs do: 28 then 31 for the
slot grown twice, 50 then 60 for the other, and 90 and 100 for the two grown
once. Nothing was ever carried at bits 6 and 7.

Damage by striking reads 50.24 and grows; armour reads 30.88 and grows; how far
it strikes from reads 550, which is a champion's reach; how fast it moves reads
325 and then 340, which is a champion's pace and then its pace in boots.

## A turret

| Group | Bits    | Value                                                                                | Shape    |
| ----- | ------- | ------------------------------------------------------------------------------------ | -------- |
| 1     | 0 to 1  | Resource at its greatest, then as it stands                                          | measured |
| 1     | 2 to 6  | What the turret is doing, and four kinds of harm it is proof against                 | counted  |
| 1     | 7 to 14 | Damage, armour, spell resistance, the modifiers on them, and how fast health returns | measured |
| 3     | 0 to 5  | Health as it stands and at its greatest, sight, speed, and size                      | measured |
| 5     | 0 to 1  | Whether anything is allowed to aim at the turret, and which side is                  | counted  |

Group 3 bits 0 and 1 carry the same value as each other throughout, which is
health standing at its greatest rather than two readings of one thing.

## A unit belonging to no side

| Group | Bits      | Value                                                                                               | Shape    |
| ----- | --------- | --------------------------------------------------------------------------------------------------- | -------- |
| 1     | 0 to 6    | Health, lifetime and resource, each as it stands and at its greatest, and the count of its lifetime | measured |
| 1     | 7 to 11   | What the unit is doing, and four kinds of harm it is proof against                                  | counted  |
| 1     | 12 and up | The modifiers on its damage and defence                                                             | measured |
| 3     | 0 to 3    | Sight, speed and size                                                                               | measured |
| 3     | 4 to 5    | Whether anything is allowed to aim at it, and which side is                                         | counted  |

This is the placement a unit uses where it keeps its resource in group 1. A
unit that keeps it in group 3 moves every bit after it, and no capture shows
one, so that placement is not recorded here.

## A prop

| Group | Bits   | Value                                                       | Shape    |
| ----- | ------ | ----------------------------------------------------------- | -------- |
| 1     | 0 to 1 | Health as it stands and at its greatest                     | measured |
| 1     | 2      | Whether the prop is proof against harm                      | counted  |
| 3     | 0 to 3 | Sight, speed and size                                       | measured |
| 3     | 4 to 5 | Whether anything is allowed to aim at it, and which side is | counted  |
