# Spells

Casting, levelling spells, cooldowns, and the missiles casts send out.
Applies to 4.20 clients, as [Versions](versions.md) describes.

## Casting

A client asks to cast from one of its champion's slots with `CastSpell`, at a
point or at a unit. A server answers with `SpellCastAnswer`, which says the unit
is casting and carries the whole casting: the spell, its level, its target, its
timings and the missile it will send. A client shows the cast from that answer;
`CastSpell` alone shows nothing. A server then sets how long until the slot is
ready with `SpellCooldown`, and, for a spell with uses, how many are left with
`SpellCharges`.

Which slots a client lets its player cast from at all is a value of the
champion's that [replication](replication.md) carries.

A 4.17 spell that charges, such as one held down before it is let go, charges
where the cast answer leaves its end-of-charge flag clear. The client then sends
`SpellCharge` with the cursor's position as the charge goes on, where the spell
updates at all, and once more as the charge ends.

A server ends a spell's aiming on a client with `CancelTargeting`, and sets
which spells a unit casts by itself with `Autocast`.

## Levelling

A client asks to put a point into a spell with `UpgradeSpell`. A server answers
with `SpellUpgraded`, on the clock channel, and a client shows the new level;
`SpellLevel` sets a level outright. The spell points a champion has to spend
are what `LevelUp` carries. A 4.17 server can set how far each
spell can be raised, and at which champion levels, with `SpellRankLimits`.

## What a slot holds

`SpellInSlot` puts a spell in a slot. `SpellSlotChanged` changes one thing about
a spell already there: how it is aimed, its name, its ranges, its icon, or the
units it is cast from. `SpellToggled` turns a spell on or off, `SpellNumbers`
fills in the numbers a client shows beside a unit's spells, and
`SpellCostChanged` changes what a spell costs. A 4.17 server can also draw rings
around its player's cursor with `CursorRings`.

## Missiles

A missile is named by its own id. `MissileState` says where one is and what it
is doing, with the casting that sent it; `MissileLaunched` says the missile a
swing or a cast prepared has left the unit. A server changes what a missile
flies at with `MissileRetarget` and how fast with `MissileSpeed`, says what it
struck with `MissileHits`, and is rid of it with `DestroyMissile`. A missile that
bounces from unit to unit does so with `BounceMissile`, and a 4.17 server can
name in advance the units a chain missile will strike with `ChainTargets`.

## Messages

<!-- messages:begin -->

| Message                                                        | Sent by | 4.20            | What it does                                                                |
| -------------------------------------------------------------- | ------- | --------------- | --------------------------------------------------------------------------- |
| [`CastSpell`](../schema/messages/CastSpell.json)               | client  | 154 on requests | Cast something from a slot, at a point or at a unit                         |
| [`DestroyMissile`](../schema/messages/DestroyMissile.json)     | server  | 90 on events    | Be rid of a missile a client is drawing                                     |
| [`MissileState`](../schema/messages/MissileState.json)         | server  | 59 on events    | Say where a missile is and what it is doing                                 |
| [`SpellCastAnswer`](../schema/messages/SpellCastAnswer.json)   | server  | 181 on events   | Say a unit is casting a spell                                               |
| [`SpellCharges`](../schema/messages/SpellCharges.json)         | server  | 263 on events   | Say how many uses one of a unit's spells has left and when the next returns |
| [`SpellCooldown`](../schema/messages/SpellCooldown.json)       | server  | 133 on events   | Set how long until one of a unit's spells is ready                          |
| [`SpellInSlot`](../schema/messages/SpellInSlot.json)           | server  | 112 on events   | Put a spell in one of a unit's slots                                        |
| [`SpellLevel`](../schema/messages/SpellLevel.json)             | server  | 91 on events    | Set the level of one of a unit's spells                                     |
| [`SpellNumbers`](../schema/messages/SpellNumbers.json)         | server  | 127 on events   | Fill in the numbers a client shows beside a unit's spells                   |
| [`SpellSlotChanged`](../schema/messages/SpellSlotChanged.json) | server  | 23 on events    | Change one thing about a spell already in a unit's slot                     |
| [`SpellToggled`](../schema/messages/SpellToggled.json)         | server  | 280 on events   | Turn one of a unit's spells on or off                                       |
| [`SpellUpgraded`](../schema/messages/SpellUpgraded.json)       | server  | 21 on clock     | Confirm a unit's spell went up a level                                      |
| [`UpgradeSpell`](../schema/messages/UpgradeSpell.json)         | client  | 57 on requests  | Put a point into a spell                                                    |

<!-- messages:end -->
