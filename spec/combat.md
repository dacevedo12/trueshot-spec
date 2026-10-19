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

## Messages

<!-- messages:begin -->

| Message                                                            | Sent by | 1.0  | 4.17           | 4.18           | 4.20           | What it does                                                                                                                                                                                                   |
| ------------------------------------------------------------------ | ------- | ---- | -------------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`Attack`](../schema/messages/Attack.json)                         | server  | none | 12 on events   | none           | 12 on events   | Say a unit is swinging at another                                                                                                                                                                              |
| [`AttackFrom`](../schema/messages/AttackFrom.json)                 | server  | none | 26 on events   | none           | 26 on events   | Say a unit is swinging at another, carrying where the swinging unit stands as well as what it swings at                                                                                                        |
| [`AttackIndicators`](../schema/messages/AttackIndicators.json)     | server  | none | 258 on events  | none           | 258 on events  | Show or hide a unit's attack indicators                                                                                                                                                                        |
| [`AttackSpeedBounds`](../schema/messages/AttackSpeedBounds.json)   | server  | none | 288 on events  | none           | 288 on events  | Put a ceiling or a floor on how fast a unit attacks                                                                                                                                                            |
| [`BuildingDied`](../schema/messages/BuildingDied.json)             | server  | none | 137 on events  | 137 on events  | 137 on events  | What a server sends when a building is destroyed                                                                                                                                                               |
| [`ChampionDied`](../schema/messages/ChampionDied.json)             | server  | none | 94 on events   | none           | 94 on events   | Say a champion died                                                                                                                                                                                            |
| [`Damage`](../schema/messages/Damage.json)                         | server  | none | 101 on events  | none           | 101 on events  | Say one unit hurt another                                                                                                                                                                                      |
| [`DeathHistory`](../schema/messages/DeathHistory.json)             | server  | none | 33 on events   | none           | 33 on events   | Say what led to a death, so the client can lay it out                                                                                                                                                          |
| [`DeathTimer`](../schema/messages/DeathTimer.json)                 | server  | none | 279 on events  | 279 on events  | 279 on events  | Set how long a champion stays down                                                                                                                                                                             |
| [`ForceDeath`](../schema/messages/ForceDeath.json)                 | server  | none | 27 on events   | 27 on events   | 27 on events   | Put a unit into its death                                                                                                                                                                                      |
| [`GreyscaleWhenDead`](../schema/messages/GreyscaleWhenDead.json)   | server  | none | 169 on events  | 169 on events  | 169 on events  | Say whether a client draws the world without colour while its champion is down                                                                                                                                 |
| [`GroundAttackMode`](../schema/messages/GroundAttackMode.json)     | server  | none | 257 on events  | 257 on events  | 257 on events  | Make a champion's clicks attack the ground                                                                                                                                                                     |
| [`HoverIndicator`](../schema/messages/HoverIndicator.json)         | server  | none | 246 on events  | 246 on events  | 246 on events  | Turn a unit's hover indicator on or off                                                                                                                                                                        |
| [`HoverTarget`](../schema/messages/HoverTarget.json)               | server  | none | 245 on events  | 245 on events  | 245 on events  | Set the unit a unit's hover indicator points at                                                                                                                                                                |
| [`InhibitorState`](../schema/messages/InhibitorState.json)         | server  | none | 43 on events   | none           | 43 on events   | Change the state of an inhibitor, and say how long the new state lasts                                                                                                                                         |
| [`Respawned`](../schema/messages/Respawned.json)                   | server  | none | 74 on events   | 74 on events   | 74 on events   | Bring a dead champion back at a place, with full health                                                                                                                                                        |
| [`Revived`](../schema/messages/Revived.json)                       | server  | none | 47 on events   | 47 on events   | 47 on events   | Put a champion back on the field                                                                                                                                                                               |
| [`StopAttack`](../schema/messages/StopAttack.json)                 | server  | none | 52 on events   | none           | 52 on events   | Break off an attack a unit is making                                                                                                                                                                           |
| [`TargetHeldChampion`](../schema/messages/TargetHeldChampion.json) | server  | none | 192 on events  | 192 on events  | 192 on events  | Mark that a unit is attacking a champion, or to take the mark away                                                                                                                                             |
| [`TargetUnit`](../schema/messages/TargetUnit.json)                 | server  | none | 106 on events  | 106 on events  | 106 on events  | Say what a unit is attacking, whatever the unit attacked is                                                                                                                                                    |
| [`UnitDied`](../schema/messages/UnitDied.json)                     | server  | none | 158 on events  | none           | 158 on events  | Say a unit died, to everyone who can see it                                                                                                                                                                    |
| [`UnitDiedOnMap`](../schema/messages/UnitDiedOnMap.json)           | server  | none | none           | none           | 294 on events  | Say a unit died, for what the client draws on its map rather than on the field                                                                                                                                 |
| [`UseObject`](../schema/messages/UseObject.json)                   | client  | none | 58 on requests | 58 on requests | 58 on requests | Use a unit: as its player right-clicks a unit its character data makes usable by them and off its use cooldown, and also as a unit its champion is attacking changes side (TeamChanged), whether usable or not |

<!-- messages:end -->
