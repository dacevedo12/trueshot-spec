# Replication

The most frequent thing a server sends is a statement of what has changed about
the units a client can see. `schema/messages/Replication.json` records its
layout: for each unit, the groups of values it carries, and for each group,
which of its values follow.

<!-- binding: layout -->

That much a layout reaches. What the values are it does not, and this document
says what settles them.

## What settles a reading

A run is a sequence of values with nothing between them, in the order the set
bits name them, lowest first.

The bit that names a value means different things for different units. A
champion, a turret, a minion, a prop, a unit belonging to no side and a
building each answer to their own table, so the same bit in the same group is
one value on one unit and another on the next. A sending end MUST write the
table the unit it names answers to.

Which table a unit answers to follows from the message that put it on the
field and the names that message carried. A building, which no message
creates, answers to the building table of the map loaded.

Nothing on the wire carries a table, a field name, or a width. An end that does
not already hold the table cannot read a run.

## Which batches a client takes

A client applies a unit's values from a batch only where the batch's `syncId`
is greater than that of the last batch it applied for that unit and group. A client answers a batch with `TransientAck` whether or not it took the
values. [Ordering](ordering.md) gives the rules for these numbers, when a
batch goes unanswered, and what they require of a server.

## Reading the tables

Each row gives the group and bits that name a value and what the value is.

<!-- binding: tables -->

## Values stated outside a batch

Besides its batches, a server states some values with messages of their own. It
grants experience with `ExperienceGained` and gold with `GoldGained`, and can
send the gold a unit earns to another with `GoldRedirect`. A
level gained is `LevelUp`, which on its own is enough for a client to show the
new level on its champion's portrait. A server sets a champion's tallies for the
scoreboard with `ChampionStats`. A server can also add to a unit's shield
(`ShieldAdded`), change how its health bar or resource bar is shown
(`HealthBar`, `ResourceDisplay`), change the sort of resource it has
(`ResourceKindChanged`), set the highest level a champion reaches
(`LevelCap`), and count minions killed, scores and deeds (`MinionKillCount`,
`ScoreAdded`, `StatisticIncremented`). A client acknowledges each batch with
`TransientAck`.

<!-- messages -->
