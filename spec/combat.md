# Combat

Attacks, damage, death and coming back. A client asks its champion to attack
with an order (see [Movement](movement.md)); everything after that is the
server's to say. Spells are in [Spells](spells.md).

## Attacking

A server says a unit is swinging at another with `Attack`, or with
`AttackFrom`, which also says where the swinging unit stands. `StopAttack`
breaks an attack off. `AttackSpeedBounds` puts a ceiling or a floor on how fast a
unit attacks.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> After `StopAttack`, a client clears the unit's attack whatever the message's flags ask besides.

A client asks its champion to attack with a `MoveOrder` naming the unit. What
the player then sees is what a server sends: the champion walking into range
along a `WaypointGroup`, a swing for each `Attack`, a figure for each `Damage`,
and the health bar moving as [replication](replication.md) states the health.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client never walks its champion into range by itself: a server sends the
> `WaypointGroup` that takes it there. Each `Attack` plays one swing, cutting off
> any swing still under way; how long a swing takes comes from the champion's
> data and its attack speed, not from the message. A melee swing carries a
> missile id of zero. A ranged swing carries an id no object holds, which the
> client gives the missile it launches itself as the swing lets go, with no
> further message while the attacker is in view. `TargetUnit` and
> `TargetHeldChampion` are not needed for a swing to show.
>
> `Damage` shows a figure for the results that carry one, normal and critical;
> zero is the result that shows the unit as invulnerable, not a plain hit. The
> health bar moves only as replication states the unit's health. A swing that
> nothing interrupts finishes by itself; `StopAttack` breaks one off before it
> lets go.

What a unit is attacking, whatever it is, is `TargetUnit`, which draws the
targeting beam. That a unit is attacking a champion is `TargetHeldChampion`,
which marks the unit's health bar with an indicator, and clears the mark when it
names no such champion. A server MUST send the two together. `HoverTarget` and
`HoverIndicator` set and show the unit a unit's hover indicator points at, and
`AttackIndicators` shows or hides a unit's attack indicators.

A champion's clicks can be made to attack the ground with `GroundAttackMode`.

## Damage

A server reports damage with `Damage`. A client shows the figure and nothing
more: the health a client shows comes from [replication](replication.md), which
this message leaves as it was.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client shows nothing at all for `Damage` unless it holds both the unit hurt and the unit dealing it.

## Death

A champion's death is `ChampionDied`, any other unit's `UnitDied`, and a
building's `BuildingDied`. Either of the first two can leave the unit standing
as a husk rather than dead, without its death animation or death screen.
`ForceDeath` puts a unit into its death.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client ignores `ChampionDied` that credits no killer, or names a champion
> already dead, and puts a unit down on `UnitDied` only where a killer is named.

How long a champion stays down is `DeathTimer`. Whether a client draws the world
without colour while its champion is down is `GreyscaleWhenDead`. What led to a
death is `DeathHistory`, which a client lays out for its player. A server MUST
size each entry as its kind's layout states.

An inhibitor's state, and how long it lasts, is `InhibitorState`.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A server also reports a death for what a client draws on its map with `UnitDiedOnMap`.

## Coming back

`Revived` puts a champion back on the field. A server can instead bring a
dead champion back at a place of its choosing with `Respawned`, which keeps the
champion's level, gold and spell ranks and restores its health.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> ## Using a unit
>
> A client sends `UseObject` as its player right-clicks a unit that can be
> used, and also, for a unit its champion is attacking, as that unit changes side.

<!-- messages -->
