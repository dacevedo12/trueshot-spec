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
champion, a turret, a minion, a prop, a unit belonging to no side and a
building each answer to their own table, so the same bit in the same group is
one value on one unit and another on the next. A sending end MUST write the
table the unit it names answers to, and MUST NOT write one unit's table for
another.

A receiving end holds the table because it made the unit, from the message that
put the unit on the field and the names that message carried. A building is the
exception: one comes into sight like anything else and nothing ever creates it,
so a receiving end holds its table from the map it loaded rather than from
anything a server said.

Nothing on the wire carries a table, a field name, or a width. An end that does
not already hold the table cannot read a run.

## Which batches a client takes

A client keeps, for each unit, the `syncId` of the last batch whose values it
took for that unit. It takes a unit's values from a later batch only where that
batch's `syncId` is greater. Values carried under an equal or a lower `syncId`
are dropped, including a `syncId` no batch has used before. The comparison is
made unit by unit, so a `syncId` one batch has used for a turret is still taken
for a champion.

A server MUST give each batch carrying a unit a `syncId` greater than the last
it sent carrying that unit. Batches for different units can share a `syncId`.

A client answers a batch with `TransientAck` whether or not it took the values,
so an answer says that a batch arrived and not that its values were taken.

## How far these tables are checked

Every table below was run against every replicated value in the captures behind
this specification: 682,561 runs, each taken apart by the shapes its table
gives and each ending exactly where its length says. None failed, and none was
left over.

That is weaker evidence than it looks, and this section says how much weaker.

A wrong shape runs off the end of a run or stops short of it wherever the two
shapes disagree about how many bytes a value takes, which is what the count
above rests on. They do not always disagree. A counted value of four bytes,
where each of the first three carries its continuing bit, takes the same four
bytes a measure takes, so the two readings of that one value cannot be told
apart by where the run ends. Putting the wrong shape at one place and
reading every run again finds the mistake at 122 of the 133 places the tables name. At the other eleven it does not.

Six of those eleven the values settle instead: read as a measure each holds a
number too small for anything to mean by it, and read as a count each holds the
same handful of values over and over, which is what a set of flags does. The remaining five are named from the places either side of them and nothing
observed tells them apart.

None of this checks the names. A name below is confirmed only where the traffic
bears it out, and those are marked.

Nor does any of it reach a place no payload ever names. Every table says which
of a row's bits were ever seen set. Where that column reads none, the row is a
shape and a meaning written down so that nothing is silently missing, and no
payload behind this specification tests it. Where it names some of the bits,
the rest are in that state.

## A champion

| Group | Bits     | Value                                                                                                  | Shape    | Seen set |
| ----- | -------- | ------------------------------------------------------------------------------------------------------ | -------- | -------- |
| 0     | 0        | Gold in hand, confirmed                                                                                | measured | all      |
| 0     | 1        | Gold earned in all                                                                                     | measured | none     |
| 0     | 2 to 3   | Which of the champion's slots can be cast from, as a set of bits over two words, confirmed             | counted  | all      |
| 0     | 4 to 5   | Which summoner slots can be cast from, as a set of bits over two words, confirmed                      | counted  | all      |
| 0     | 6        | Points held for evolving a spell                                                                       | counted  | none     |
| 0     | 7        | Which spells have evolved, as a set of bits                                                            | counted  | none     |
| 0     | 8 to 27  | What the spell in one slot costs, confirmed for the first four                                         | measured | all      |
| 1     | 0 to 4   | What the champion is doing, and four kinds of harm it is proof against                                 | counted  | all      |
| 1     | 5        | Damage it deals by striking, confirmed                                                                 | measured | all      |
| 1     | 6        | Damage its spells deal before modifiers                                                                | measured | all      |
| 1     | 7        | How often it turns a blow aside                                                                        | measured | none     |
| 1     | 8        | How often it strikes critically                                                                        | measured | all      |
| 1     | 9        | Armour, confirmed                                                                                      | measured | all      |
| 1     | 10       | Spell resistance                                                                                       | measured | all      |
| 1     | 11 to 12 | How fast health and resource return                                                                    | measured | all      |
| 1     | 13       | How far it strikes from, confirmed                                                                     | measured | all      |
| 1     | 14 to 16 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | measured | all      |
| 1     | 17 to 18 | Flat and percent reduction of the spell damage it takes                                                | measured | none     |
| 1     | 19       | A multiplier on how fast it strikes, confirmed                                                         | measured | all      |
| 1     | 20       | A flat addition to how far from the champion an aimed spell's point is allowed to land                 | measured | all      |
| 1     | 21       | A modifier on its cooldowns, confirmed                                                                 | measured | all      |
| 1     | 22       | When its passive's cooldown ends, as a moment on the match clock, confirmed                            | measured | none     |
| 1     | 23       | How long its passive's cooldown lasts in all                                                           | measured | none     |
| 1     | 24 to 25 | How much armour it cuts through, flat then as the share left standing, confirmed                       | measured | all      |
| 1     | 26 to 27 | How much spell resistance it cuts through, flat then as the share left standing, confirmed             | measured | all      |
| 1     | 28       | Life steal, confirmed                                                                                  | measured | all      |
| 1     | 29       | Spell vamp, confirmed                                                                                  | measured | all      |
| 1     | 30       | Crowd-control reduction, confirmed                                                                     | measured | all      |
| 2     | 0 to 1   | How much more armour and spell resistance it cuts through, as the share left standing, confirmed       | measured | all      |
| 3     | 0 to 1   | Health and resource as they stand, confirmed                                                           | measured | all      |
| 3     | 2 to 3   | Health and resource at their greatest, confirmed                                                       | measured | all      |
| 3     | 4        | Experience, confirmed                                                                                  | measured | all      |
| 3     | 5 to 9   | Lifetime, and how far the champion sees                                                                | measured | none     |
| 3     | 10       | How fast it moves, confirmed                                                                           | measured | all      |
| 3     | 11 to 12 | Its size, and how wide a path it needs                                                                 | measured | 11       |
| 3     | 13       | Level, confirmed                                                                                       | counted  | all      |
| 3     | 14 to 16 | Kills taken from no side, and whether anything is allowed to aim at it                                 | counted  | all      |

A name marked confirmed is one a champion's own numbers bear out, or one a client's
panel of champion statistics shows back when sent a value nothing else explains.

Gold in hand climbs by exactly 0.95 a step across a match, which is what a
champion earns for standing still, and falls by 35 in one step, which is what
an item costs. Health and resource as they stand climb the way those climb, and
each opens at the value its own greatest carries. Level climbs to 18 in one game and to 16 in another, and experience climbs alongside it from 0 to more than 26000.

The two sets of slots that can be cast from read the way their names say. Bit 2 turns on slots 0, 1, 2 and 3 one at a time as a champion learns its spells, and bit 4 carries slots 4 and 5, the summoner slots, in every run. Bits 3 and 5 hold zero throughout.

Spell costs are keyed by slot: bit 8 carries what the spell in slot 0 costs,
bit 9 slot 1, bit 10 slot 2 and bit 11 slot 3. Bits 12 to 27 belong to the same run and hold zero in everything observed, so which slots they answer to is not settled. Captures settle this outright. Of the requests captured to grow a spell, seventeen were followed by a change to a cost, and each time the change sat at the bit eight above the slot asked for, across all four slots.

Bits 6 and 7 are not the first two of that run: they hold the points a champion has for evolving a spell and the set of spells that have evolved. One mask sets bits 8 to 27 together, carrying zero at every place no spell fills, and leaves 6 and 7 clear. Where captured traffic does set them, each carries zero, and every such run reads exactly with both counted and fails with both measured.

Damage by striking reads from 54.67 to 115.3, and armour from 32.38 to 90.38; three values above 100000 also appear for armour, which nothing observed explains. How far a champion strikes from reads 150 for one and 550 for another, and how fast it moves reads 325, 340, 370 and 600.

A client shows bits 19, 21, 28 and 29 of the first group back in its panel of
champion statistics. Sent 0.5 at bit 19, it shows the champion's attack speed
halved. Sent −0.1 at bit 21, it shows 10 percent cooldown reduction, and sent 0.2 it shows 20 percent, so the panel shows the size of that modifier whatever its sign. Sent 0.12
at bit 28 and 0.34 at bit 29, it shows life steal of 12 percent and spell vamp
of 34 percent. Sent 2.0 at bit 20 and −0.3 at bit 22 at the same time, the panel
moves on neither. Bit 31 is never seen set, and nothing here gives it a value.

Penetration shows in that panel as a flat figure and a percent. Sent 5 at bit 24
and 7 at bit 26, it shows flat penetration of 5 and 7. Each percent field
carries the share of armour or spell resistance left standing, and the panel
adds up what two of them cut through: bit 25 of the first group with bit 0 of
the second for armour, and bit 27 with bit 1 for spell resistance. Sent 0.8 and
0.9 it shows 30 percent, sent 0.7 and 0.95 it shows 35 percent, and a champion
none of the four was ever sent for shows 200 percent on both. A champion that
cuts through nothing carries 1 at each. Sent 0.25 at bit 30, the panel shows 25
percent tenacity.

A spell's cooldown lasts its base length times one plus the modifier at bit 21,
so a reduction is carried as a negative fraction and the panel shows its size.

Bit 22 sets the countdown a client shows on the champion's passive. It is a
moment on the match clock, in seconds, on the same clock as the time a
`ClockSync` carries, and not the time left. Sent 120 as a match opens, the
countdown starts from 2:00; sent 180, it starts from 3:00. Once that moment has
passed, the passive shows ready. Bit 23 is how long the whole cooldown lasts,
and a client shades the passive's icon by the time left over that length rather
than counting down from it: sent 360 alongside 180, the countdown still starts
from 3:00.

## A turret

| Group | Bits    | Value                                                                      | Shape    | Seen set |
| ----- | ------- | -------------------------------------------------------------------------- | -------- | -------- |
| 1     | 0 to 1  | Resource at its greatest, then as it stands                                | measured | none     |
| 1     | 2 to 6  | What the turret is doing, and four kinds of harm it is proof against       | counted  | all      |
| 1     | 7       | Damage it deals by striking, confirmed                                     | measured | all      |
| 1     | 8       | Armour, confirmed                                                          | measured | all      |
| 1     | 9 to 14 | Spell resistance, the modifiers on its damage, and how fast health returns | measured | all      |
| 3     | 0 to 1  | Health as it stands, then at its greatest, confirmed                       | measured | all      |
| 3     | 2 to 3  | How far it sees                                                            | measured | none     |
| 3     | 4       | How fast it moves                                                          | measured | all      |
| 3     | 5       | Its size                                                                   | measured | all      |
| 5     | 0 to 1  | Whether anything is allowed to aim at it, and which side is                | counted  | all      |

Health at its greatest runs from 1000 to 3150 across the turrets of the maps
captured, and reads 9999 for a few, which is what turrets of differing standing hold, and
both figures are raised once early in a match, health as it stands following health at its greatest up to the same value. After that health as it stands only falls: across the captures it falls 260 times and never rises after a fall.
Damage by striking runs from 130 to 190, and reads 450 and 999 for a few, and armour runs from 50 to 78, and reads 0, 100 and 133 for a few.

## A minion, and a unit belonging to no side

Both answer to one table.

| Group | Bits     | Value                                                                      | Shape    | Seen set                                               |
| ----- | -------- | -------------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| 1     | 0 to 1   | Health as it stands, then at its greatest, confirmed                       | measured | all                                                    |
| 1     | 2 to 4   | How long it lives, as it stands and at its greatest, and the count of that | measured | none                                                   |
| 1     | 5 to 6   | Resource at its greatest, then as it stands                                | measured | none for a minion, all for a unit belonging to no side |
| 1     | 7 to 11  | What the unit is doing, and four kinds of harm it is proof against         | counted  | all                                                    |
| 1     | 12       | Damage it deals by striking, confirmed                                     | measured | all                                                    |
| 1     | 13 to 31 | Its defences and the modifiers on them                                     | measured | 13 to 22                                               |
| 3     | 0 to 1   | How far it sees                                                            | measured | none                                                   |
| 3     | 2        | How fast it moves, confirmed                                               | measured | all                                                    |
| 3     | 3        | Its size                                                                   | measured | all                                                    |
| 3     | 4 to 5   | Whether anything is allowed to aim at it, and which side is                | counted  | all                                                    |

Health at its greatest reads 290, 455, 700 and 1500 for the units a side sends out, and damage by striking reads 12, 23, 40 and 180 alongside. For a unit belonging to no side the same two run from 250 to 3500, and from 12 to 230. How fast a unit a side sends out moves reads 325.

Every captured run of these units reads under this placement.

## A building

Inhibitors and nexuses. [spec/messages.md](messages.md) says how the
identifier of each is worked out from its name, which is how a receiving end
knows one no message ever created. Where a map's buildings replicate at all they carry these two groups, and nothing else has been seen. On map 8 none replicate.

| Group | Bits   | Value                                                       | Shape    | Seen set |
| ----- | ------ | ----------------------------------------------------------- | -------- | -------- |
| 1     | 0      | Health as it stands                                         | measured | all      |
| 1     | 1      | Whether the building is proof against harm                  | counted  | all      |
| 5     | 0 to 1 | Whether anything is allowed to aim at it, and which side is | counted  | all      |

An inhibitor reads 4000 on maps 1 and 11 and 3000 on map 10, and a nexus reads 5500 on all three. On map 12 every building reads 0. No building's figure changes within any capture, including the buildings destroyed in a game played to its end, whose figure stays 0 before and after. The figure is health as it stands, and nothing in the captures shows it move. Each building is spoken of first by coming into a side's sight.

## A prop

No capture behind this specification carries a replicated value for a prop.
379 of them were put on the field across the captured sessions and not one was ever spoken of again, so the table below is not evidence in the way the others
are: it is the shape a reading end would need, written down so that nothing is
silently missing, and nothing here has been tested against a payload.

| Group | Bits   | Value                                                       | Shape    | Seen set |
| ----- | ------ | ----------------------------------------------------------- | -------- | -------- |
| 1     | 0 to 1 | Health as it stands, then at its greatest                   | measured | none     |
| 1     | 2      | Whether the prop is proof against harm                      | counted  | none     |
| 3     | 0 to 1 | How far it sees                                             | measured | none     |
| 3     | 2      | How fast it moves                                           | measured | none     |
| 3     | 3      | Its size                                                    | measured | none     |
| 3     | 4 to 5 | Whether anything is allowed to aim at it, and which side is | counted  | none     |
