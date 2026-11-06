# Spells

Casting, levelling spells, cooldowns, and the missiles casts send out.

## Casting

A client asks to cast from one of its champion's slots with `CastSpell`, at a
point or at a unit. A server answers with `SpellCastAnswer`, which says the unit
is casting and carries the whole casting: the spell, its level, its target, its
timings and the missile it will send. A client shows the cast from that answer;
`CastSpell` alone shows nothing. A server then sets how long until the slot is
ready with `SpellCooldown`, and, for a spell with uses, how many are left with
`SpellCharges`. A client reports a cooldown it sets by itself with
`CooldownSet`.

Which slots a client lets its player cast from at all is a value of the
champion's that [replication](replication.md) carries.

<!-- holds from 0.8.13.26 up to 0.9.25.36 -->

> **In 0.8.13.26–0.9.25.35**
>
> A client still casts from a casting record whose length disagrees with its
> count of targets.

<!-- holds from 1.0.0.58 up to 4.20.0.315 -->

> **In 1.0.0.58–4.19**
>
> A client casts nothing for a casting record whose length disagrees with its
> count of targets.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> The casting record names the spell by the hash of its name, and a client casts
> nothing for a spell it has not loaded.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> `SpellCastAnswer` is both the answer to the client that asked and what every
> client sees of the cast; there is nothing else to send it. A client applies
> the cost and the cooldown only where the record names the caster. As the cast
> lets go, a client starts the slot's cooldown from the record, where that is
> longer than what remains, spends the record's cost, and launches the record's
> missile itself while the caster is in view.
>
> A cast the client takes also places the caster at the record's launch point,
> unless the record says to keep it, so a server sends where the caster stands.
> The answer's movement sync id is counted with the paths a unit takes (see
> [Ordering](ordering.md)).
>
> A client lets its player cast from a slot only where the spell in it has a
> level above zero, its castable bit is set, it is off cooldown, its cost is
> within the champion's mana, and the champion's action state allows casting.

A spell held down before it is let go charges where the cast answer leaves its
flags clear. While it charges, a client sends `SpellCharge` with the cursor's
position, and once more as the charge ends.

A server ends a spell's aiming on a client with `CancelTargeting`, shows and
takes away a spell's targeter on a client's own champion with
`SpellTargeterShown` and `SpellTargeterHidden`, and sets which spells a unit
casts by itself with `Autocast`.

## Levelling

A client asks to put a point into a spell with `UpgradeSpell`. A server answers
with `SpellUpgraded`, and a client shows the new level;
`SpellLevel` sets a level outright. The spell points a champion has to spend
are what `LevelUp` carries. A server can set how far each
spell can be raised, and at which champion levels, with `SpellRankLimits`.

<!-- holds from 0.8.13.26 up to 4.20.0.315 -->

> **In 0.8.13.26–4.19**
>
> A client spends the point as it sends `UpgradeSpell`. `LevelUp` states the
> champion's level and its points.

<!-- holds from 0.9.25.24 up to 1.0.0.61 -->

> **In 0.9.25.24–1.0.0.60**
>
> A command its player types sends `UpgradeSpell` without checking anything.

<!-- holds from 3.10.0.237 up to 4.20.0.315 -->

> **In 3.10–4.19**
>
> A client asks only where the champion has a point to spend, is of the level
> the slot requires, and the spell is below its highest level. A request a
> server never answers leaves the level as it was and the point spent, until
> the next `SpellUpgraded` or `LevelUp`.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client also sends `UpgradeSpell` for a point of a separate kind the champion
> holds, and spends no spell point for it.

## What a slot holds

`SpellInSlot` puts a spell in a slot. `SpellSlotChanged` changes one thing about
a spell already there: how it is aimed, its name, its ranges, its icon, or the
units it is cast from. `SpellTargetingChanged`, `SpellNameChanged`,
`SpellRangeChanged`, `SpellIconChanged` and `SpellOffsetTargetChanged` each
change one of these alone, and `SpellSlotChangedForOwner` changes a slot as
`SpellSlotChanged` does, for the owner's client alone. `SpellToggled` turns a spell on or off, `SpellNumbers`
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
`MissileCourse` sets where a missile starts and how fast it flies, and restarts
its flight. A client reports where a missile that flies straight is, and where
it is going, with `MissileReport`, which a server MAY ignore.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> Only a missile that flies straight acts on `MissileHits`.

<!-- messages -->
