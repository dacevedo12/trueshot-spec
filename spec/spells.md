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

<!-- messages -->
