# Combat

Attacks, damage, death and coming back. A client asks its champion to attack
with an order (see [Movement](movement.md)); everything after that is the
server's to say. Spells are in [Spells](spells.md).

## Attacking

A server says a unit is swinging at another with `Attack`, or with
`AttackFrom`, which also says where the swinging unit stands. `StopAttack`
breaks an attack off. `AttackSpeedBounds` puts a ceiling or a floor on how fast a
unit attacks.

<!-- binding: stop-attack -->

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

<!-- binding: damage -->

## Death

A champion's death is `ChampionDied`, any other unit's `UnitDied`, and a
building's `BuildingDied`. Either of the first two can leave the unit standing
as a husk rather than dead, without its death animation or death screen.
`ForceDeath` puts a unit into its death.

<!-- binding: death -->

How long a champion stays down is `DeathTimer`. Whether a client draws the world
without colour while its champion is down is `GreyscaleWhenDead`. What led to a
death is `DeathHistory`, which a client lays out for its player. A server MUST
size each entry as its kind's layout states.

An inhibitor's state, and how long it lasts, is `InhibitorState`.

<!-- binding: death-on-map -->

## Coming back

`Revived` puts a champion back on the field. A server can instead bring a
dead champion back at a place of its choosing with `Respawned`, which keeps the
champion's level, gold and spell ranks and restores its health.

<!-- binding: using-a-unit -->

<!-- messages -->
