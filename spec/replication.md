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
this specification: 679,677 runs, each taken apart by the shapes its table
gives and each ending exactly where its length says. None failed, and none was
left over.

That is weaker evidence than it looks, and this section says how much weaker.

A wrong shape runs off the end of a run or stops short of it wherever the two
shapes disagree about how many bytes a value takes, which is what the count
above rests on. They do not always disagree. A counted value of four bytes,
where each of the first three carries its continuing bit, takes the same four
bytes a measure takes, so the two readings of that one value cannot be told
apart by where the run ends. Putting the wrong shape at one place and
reading every run again finds the mistake at 118 of the 129 places the tables
name. At the other eleven it does not.

Seven of those eleven the values settle instead: read as a measure each holds a
number too small for anything to mean by it, and read as a count each holds the
same handful of values over and over, which is what a set of flags does. The
remaining four are named from the places either side of them and nothing
observed tells them apart.

None of this checks the names. A name below is confirmed only where the traffic
bears it out, and those are marked.

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
once.

Bits 6 and 7 are not the first two of that run. No mask in any capture sets
either, and one mask sets bits 8 to 27 together, carrying zero at every place
no spell fills. A run does not skip its own opening while writing out the rest
of itself, so what sits at 6 and 7 is something else, and nothing observed says
what.

Damage by striking reads 50.24 and grows; armour reads 30.88 and grows; how far
it strikes from reads 550, which is a champion's reach; how fast it moves reads
325 and then 340, which is a champion's pace and then its pace in boots.

## A turret

| Group | Bits    | Value                                                                      | Shape    |
| ----- | ------- | -------------------------------------------------------------------------- | -------- |
| 1     | 0 to 1  | Resource at its greatest, then as it stands                                | measured |
| 1     | 2 to 6  | What the turret is doing, and four kinds of harm it is proof against       | counted  |
| 1     | 7       | Damage it deals by striking, confirmed                                     | measured |
| 1     | 8       | Armour, confirmed                                                          | measured |
| 1     | 9 to 14 | Spell resistance, the modifiers on its damage, and how fast health returns | measured |
| 3     | 0 to 1  | Health as it stands, then at its greatest, confirmed                       | measured |
| 3     | 2 to 5  | How far it sees, how fast it moves, and its size                           | measured |
| 5     | 0 to 1  | Whether anything is allowed to aim at it, and which side is                | counted  |

Health at its greatest reads 1000, 1300, 1500, 1550 and 1750 across the
turrets of one map, which is what turrets of differing standing hold, and
health as it stands falls step by step under attack and holds still otherwise.
Damage by striking reads 150, 152, 170 and 190, and armour 0, 67, 100 and 133.

## A minion, and a unit belonging to no side

Both answer to one table.

| Group | Bits      | Value                                                                      | Shape    |
| ----- | --------- | -------------------------------------------------------------------------- | -------- |
| 1     | 0 to 1    | Health as it stands, then at its greatest, confirmed                       | measured |
| 1     | 2 to 4    | How long it lives, as it stands and at its greatest, and the count of that | measured |
| 1     | 5 to 6    | Resource at its greatest, then as it stands                                | measured |
| 1     | 7 to 11   | What the unit is doing, and four kinds of harm it is proof against         | counted  |
| 1     | 12        | Damage it deals by striking, confirmed                                     | measured |
| 1     | 13 and up | Its defences and the modifiers on them                                     | measured |
| 3     | 0 to 1    | How far it sees                                                            | measured |
| 3     | 2         | How fast it moves, confirmed                                               | measured |
| 3     | 3         | Its size                                                                   | measured |
| 3     | 4 to 5    | Whether anything is allowed to aim at it, and which side is                | counted  |

Health at its greatest reads 290, 455 and 805 for the units a side sends out,
which is what three sorts of them hold, and damage by striking reads 12, 23 and
40 alongside. For a unit belonging to no side the same two read 250 through
540, and 12 through 42. How fast it moves reads 325, and half that where
something slows it.

This is the placement where the unit keeps its resource in group 1. A unit that
keeps it in group 3 moves every bit after it, and no capture shows one.

## A prop

No capture behind this specification carries a replicated value for a prop.
Ninety one of them were put on the field across nine sessions and not one was
ever spoken of again, so the table below is not evidence in the way the others
are: it is the shape a reading end would need, written down so that nothing is
silently missing, and nothing here has been tested against a payload.

| Group | Bits   | Value                                                       | Shape    |
| ----- | ------ | ----------------------------------------------------------- | -------- |
| 1     | 0 to 1 | Health as it stands, then at its greatest                   | measured |
| 1     | 2      | Whether the prop is proof against harm                      | counted  |
| 3     | 0 to 1 | How far it sees                                             | measured |
| 3     | 2      | How fast it moves                                           | measured |
| 3     | 3      | Its size                                                    | measured |
| 3     | 4 to 5 | Whether anything is allowed to aim at it, and which side is | counted  |
