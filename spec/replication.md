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

| Group | Bits     | Value                                                                                                  | Shape    |
| ----- | -------- | ------------------------------------------------------------------------------------------------------ | -------- |
| 0     | 0        | Gold in hand, confirmed                                                                                | measured |
| 0     | 1        | Gold earned in all                                                                                     | measured |
| 0     | 2 to 3   | Which spells are ready to cast, as sets of bits, confirmed                                             | counted  |
| 0     | 4        | Points held for growing a spell                                                                        | counted  |
| 0     | 5        | Which spells have grown                                                                                | counted  |
| 0     | 6 to 9   | What each of four spells costs, confirmed                                                              | measured |
| 0     | 10 to 27 | What each further spell costs                                                                          | measured |
| 1     | 0 to 4   | What the champion is doing, and four kinds of harm it is proof against                                 | counted  |
| 1     | 5 to 31  | Damage, armour, spell resistance, regeneration, reach, and the modifiers on them                       | measured |
| 2     | 0 to 1   | How much armour and spell resistance the champion cuts through                                         | measured |
| 3     | 0 to 12  | Health, resource, experience, lifetime, sight and speed, confirmed for health, resource and experience | measured |
| 3     | 13 to 16 | Level, kills taken from no side, and whether anything is allowed to aim at the champion                | counted  |

Gold in hand is the surest. One champion's value climbs by exactly 0.95 a step
across a match, which is what a champion earns for standing still, and
another's falls by 35 in one step, which is what an item costs. Health, resource
and experience climb the way those climb.

Bits 26 and 27 of group 0 are carried by this client and are not in the table
an earlier client used, which stopped at 25.

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
