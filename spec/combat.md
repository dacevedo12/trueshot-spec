# Combat

Attacks, damage, death and coming back. Spells are in [Spells](spells.md).

## Attacking

A server says a unit is swinging at another with `Attack`, or with
`AttackFrom`, which also says where the swinging unit stands. `StopAttack`
breaks an attack off. `AttackSpeedBounds` puts a ceiling or a floor on how fast a
unit attacks.

<!-- holds from 0.8.13.26 up to 4.20.0.315 -->

> **In 0.8.13.26–4.19**
>
> After `StopAttack`, a client clears the unit's attack whatever the message's
> flags ask besides.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A client moves the attacker to the place `AttackFrom` gives only where it
> stands more than 400 units from it.

A client asks its champion to attack with a `MoveOrder` naming the unit (see
[Movement](movement.md)). What the player then sees is what a server sends: the
champion walking into range along a `WaypointGroup`, a swing for each `Attack`,
and what each `Damage` shows.

<!-- holds from 0.8.13.26 up to 4.20.0.315 -->

> **In 0.8.13.26–4.19**
>
> How long a swing takes comes from the champion's data and its attack speed,
> not from the message.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> Result 0 of `Damage` is a notice a client shows for only one in every thirty
> it receives, and result 5 a miss, shown for its player's own unit. Results 3,
> 4 and any above 5 show a figure, and for them a client lowers the hurt unit's
> health by the amount itself, without waiting for replication.

<!-- holds from 0.9.25.24 up to 4.20.0.315 -->

> **In 0.9.25.24–4.19**
>
> `Damage` shows a figure for the results that carry one, normal and critical;
> zero is the result that shows the unit as invulnerable, not a plain hit.

<!-- holds from 0.9.25.24 up to 1.0.0.127 -->

> **In 0.9.25.24–1.0.0.126**
>
> Of the other results of `Damage`, 1 shows nothing, 2 a dodge and 5 a miss; 3
> is critical, and 4 and any above 5 are normal.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> A client never walks its champion into range by itself: a server sends the
> `WaypointGroup` that takes it there.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> The health bar moves as [replication](replication.md) states the health.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Each `Attack` plays one swing, cutting off any swing still under way. A melee
> swing carries a missile id of zero. A ranged swing carries an id no object
> holds, which the client gives the missile it launches itself as the swing lets
> go, with no further message while the attacker is in view. `TargetUnit` and
> `TargetHeldChampion` are not needed for a swing to show.
>
> The health bar moves only as replication states the unit's health. A swing
> that nothing interrupts finishes by itself; `StopAttack` breaks one off before
> it lets go.

`TargetUnit` draws a unit's targeting beam at what it is attacking.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> Only a turret takes `TargetUnit`; every other unit ignores it.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> `TargetHeldChampion` marks a unit as attacking the client's own champion: a
> client sets the mark only where the message names that champion, and clears
> it for any other. A client takes it apart from `TargetUnit`.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> Any unit takes `TargetUnit`, whatever it is attacking.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> That a unit is attacking a champion is `TargetHeldChampion`, which marks the
> unit's health bar with an indicator, and clears the mark when it names no such
> champion. A server MUST send `TargetUnit` and `TargetHeldChampion` together.

`HoverTarget` and `HoverIndicator` set and show the unit a unit's hover
indicator points at, and `AttackIndicators` shows or hides a unit's attack
indicators.

A champion's clicks can be made to attack the ground with `GroundAttackMode`.

## Damage

A server reports damage with `Damage`.

<!-- holds from 0.8.13.26 up to 1.0.0.141 -->

> **In 0.8.13.26–1.0.0.140**
>
> A client shows nothing for `Damage` unless it holds the unit hurt; it need not
> hold the unit dealing it.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client shows nothing at all for `Damage` unless it holds both the unit hurt
> and the unit dealing it.

## Death

A unit's death is `UnitDied`, a champion's `ChampionDied`, a building's
`BuildingDied`, and an inhibitor's `InhibitorDied`. `ForceDeath` puts a unit
into its death.

<!-- holds from 0.8.13.26 up to 4.20.0.315 -->

> **In 0.8.13.26–4.19**
>
> A client ignores `UnitDied` or `ChampionDied` naming a unit already dead, and
> puts a unit down only where a killer is named.

<!-- holds from 0.8.13.26 up to 1.0.0.141 -->

> **In 0.8.13.26–1.0.0.140**
>
> A killer a client does not hold still puts the unit down.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> Nothing in `UnitDied` leaves the unit standing: every unit it puts down dies.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A server MUST NOT send `BuildingDied` for the nexus: a client removes the
> nexus some 4 seconds later while still using it, and fails.

<!-- holds from 1.0.0.58 up to 1.0.0.141 -->

> **In 1.0.0.58–1.0.0.140**
>
> A death that credits no killer still stops the unit's cast and attack.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> Either `UnitDied` or `ChampionDied` can leave the unit standing as a husk
> rather than dead, without its death animation or death screen.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client ignores `ChampionDied` that credits no killer.

How long a champion stays down is `DeathTimer`. Whether a client draws the world
without colour while its champion is down is `GreyscaleWhenDead`. What led to a
death is `DeathHistory`, which a client lays out for its player. An inhibitor's
state, and how long it lasts, is `InhibitorState`.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client draws the world without colour for `GreyscaleWhenDead` only under
> one of its display settings, and otherwise ignores it.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A server also reports a death for what a client draws on its map with
> `UnitDiedOnMap`.

## Coming back

`Revived` puts a champion back on the field.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> A client reads nothing from `Revived` or `Respawned`: each brings the champion
> back where it stands.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> A server can instead bring a dead champion back at a place of its choosing
> with `Respawned`, which keeps the champion's level, gold and spell ranks and
> restores its health.

## Using a unit

A client sends `UseObject` as its player right-clicks a unit that can be used.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client sends `UseObject` at no other time.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> A client also sends `UseObject` for a unit its champion is attacking, as that
> unit changes side.

<!-- messages -->
