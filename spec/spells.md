# Spells

Casting, levelling spells, cooldowns, and the missiles casts send out.

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

A spell that charges, such as one held down before it is let go, charges where
the cast answer leaves its flags clear. The client then sends
`SpellCharge` with the cursor's position as the charge goes on, where the spell
updates at all, and once more as the charge ends.

A server ends a spell's aiming on a client with `CancelTargeting`, and sets
which spells a unit casts by itself with `Autocast`.

## Levelling

A client asks to put a point into a spell with `UpgradeSpell`. A server answers
with `SpellUpgraded`, on the clock channel, and a client shows the new level;
`SpellLevel` sets a level outright. The spell points a champion has to spend
are what `LevelUp` carries. A server can set how far each
spell can be raised, and at which champion levels, with `SpellRankLimits`.

## What a slot holds

`SpellInSlot` puts a spell in a slot. `SpellSlotChanged` changes one thing about
a spell already there: how it is aimed, its name, its ranges, its icon, or the
units it is cast from. `SpellToggled` turns a spell on or off, `SpellNumbers`
fills in the numbers a client shows beside a unit's spells, and
`SpellCostChanged` changes what a spell costs. A server can also draw rings
around its player's cursor with `CursorRings`.

A marker has no slots. A server MUST NOT send `SpellInSlot` naming a marker: a
client fails on it, whatever the slot.

## Missiles

A missile is named by its own id. `MissileState` says where one is and what it
is doing, with the casting that sent it; `MissileLaunched` says the missile a
swing or a cast prepared has left the unit. A server changes what a missile
flies at with `MissileRetarget` and how fast with `MissileSpeed`, says what it
struck with `MissileHits`, and is rid of it with `DestroyMissile`. A missile that
bounces from unit to unit does so with `BounceMissile`, and a server can
name in advance the units a chain missile will strike with `ChainTargets`.

## Messages

<!-- messages:begin -->

| Message                                                                        | Sent by | Ranges          | What it does                                                                                                                                                    |
| ------------------------------------------------------------------------------ | ------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`Autocast`](../schema/messages/Autocast.json)                                 | server  | 4.10–4.20       | Set which spells a unit casts by itself                                                                                                                         |
| [`BounceMissile`](../schema/messages/BounceMissile.json)                       | server  | 4.10–4.20       | What a server sends as a missile bounces on to another unit                                                                                                     |
| [`CancelTargeting`](../schema/messages/CancelTargeting.json)                   | server  | 4.10–4.17, 4.20 | End a spell's targeting on a client                                                                                                                             |
| [`CastSpell`](../schema/messages/CastSpell.json)                               | client  | 4.10–4.17, 4.20 | Cast something from a slot, at a point or at a unit                                                                                                             |
| [`ChainTargets`](../schema/messages/ChainTargets.json)                         | server  | 4.10–4.17, 4.20 | Name the units a chain missile will strike in turn                                                                                                              |
| [`CursorRings`](../schema/messages/CursorRings.json)                           | server  | 4.10–4.20       | What a server sends its player's champion to draw rings around the cursor while no spell is being aimed                                                         |
| [`DestroyMissile`](../schema/messages/DestroyMissile.json)                     | server  | 4.10–4.20       | Be rid of a missile a client is drawing                                                                                                                         |
| [`MissileHits`](../schema/messages/MissileHits.json)                           | server  | 4.10–4.20       | Say which units a missile struck                                                                                                                                |
| [`MissileLaunched`](../schema/messages/MissileLaunched.json)                   | server  | 4.10–4.20       | What a server sends as the missile a swing or a cast prepared leaves the unit                                                                                   |
| [`MissileRetarget`](../schema/messages/MissileRetarget.json)                   | server  | 4.10–4.20       | Change what a missile flies at                                                                                                                                  |
| [`MissileSpeed`](../schema/messages/MissileSpeed.json)                         | server  | 4.10–4.20       | Change how fast a missile flies                                                                                                                                 |
| [`MissileState`](../schema/messages/MissileState.json)                         | server  | 4.10–4.20       | Say where a missile is and what it is doing                                                                                                                     |
| [`SpellCastAnswer`](../schema/messages/SpellCastAnswer.json)                   | server  | 4.10–4.20       | Say a unit is casting a spell                                                                                                                                   |
| [`SpellCharge`](../schema/messages/SpellCharge.json)                           | client  | 4.10–4.17, 4.20 | What a client sends while its player charges a spell, and as the charge ends                                                                                    |
| [`SpellCharges`](../schema/messages/SpellCharges.json)                         | server  | 4.10–4.20       | Say how many uses one of a unit's spells has left and when the next returns                                                                                     |
| [`SpellCooldown`](../schema/messages/SpellCooldown.json)                       | server  | 4.10–4.17, 4.20 | Set how long until one of a unit's spells is ready                                                                                                              |
| [`SpellCostChanged`](../schema/messages/SpellCostChanged.json)                 | server  | 4.10–4.20       | Change what a spell costs the player it is sent to                                                                                                              |
| [`SpellInSlot`](../schema/messages/SpellInSlot.json)                           | server  | 4.10–4.20       | Put a spell in one of a unit's slots                                                                                                                            |
| [`SpellLevel`](../schema/messages/SpellLevel.json)                             | server  | 4.10–4.20       | Set the level of one of a unit's spells                                                                                                                         |
| [`SpellNumbers`](../schema/messages/SpellNumbers.json)                         | server  | 4.10–4.20       | Fill in the numbers a client shows beside a unit's spells                                                                                                       |
| [`SpellRankLimits`](../schema/messages/SpellRankLimits.json)                   | server  | 4.10–4.20       | What a server sends its player's champion to set how far each spell can be raised, and at which levels                                                          |
| [`SpellSlotChanged`](../schema/messages/SpellSlotChanged.json)                 | server  | 4.10–4.17, 4.20 | Change one thing about a spell already in a unit's slot                                                                                                         |
| [`SpellSlotChangedForOwner`](../schema/messages/SpellSlotChangedForOwner.json) | server  | 4.20            | What a server sends only to the client whose unit a spell slot belongs to, to change something about the spell in it, as SpellSlotChanged does for every client |
| [`SpellTargeterHidden`](../schema/messages/SpellTargeterHidden.json)           | server  | 4.20            | Take a spell's targeter away                                                                                                                                    |
| [`SpellTargeterShown`](../schema/messages/SpellTargeterShown.json)             | server  | 4.20            | Show a spell's targeter on the client's own champion                                                                                                            |
| [`SpellToggled`](../schema/messages/SpellToggled.json)                         | server  | 4.10–4.20       | Turn one of a unit's spells on or off                                                                                                                           |
| [`SpellUpgraded`](../schema/messages/SpellUpgraded.json)                       | server  | 4.10–4.20       | Confirm a unit's spell went up a level                                                                                                                          |
| [`UpgradeSpell`](../schema/messages/UpgradeSpell.json)                         | client  | 4.10–4.20       | Put a point into a spell                                                                                                                                        |

<!-- messages:end -->
