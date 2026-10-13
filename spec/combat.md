# Combat

Attacks, damage, death and coming back. A client asks its champion to attack
with an order (see [Movement](movement.md)); everything after that is the
server's to say. Spells are in [Spells](spells.md). Applies to 4.17 and 4.20 clients, as [Versions](versions.md) describes.

## Attacking

A server says a unit is swinging at another with `Attack`, or with
`AttackFrom`, which also says where the swinging unit stands. `StopAttack`
breaks an attack off, and a 4.17 client then clears the unit's attack whatever
the message's flags ask besides. `AttackSpeedBounds` puts a ceiling or a floor
on how fast a unit attacks.

What a unit is attacking, whatever it is, is `TargetUnit`, which draws the
targeting beam. That a unit is attacking a champion is `TargetHeldChampion`,
which marks the unit's health bar with an indicator, and clears the mark when it
names no such champion. A server MUST send the two together. `HoverTarget` and
`HoverIndicator` set and show the unit a unit's hover indicator points at, and
`AttackIndicators` shows or hides a unit's attack indicators.

A 4.17 champion's clicks can be made to attack the ground with
`GroundAttackMode`.

## Damage

A server reports damage with `Damage`. A client shows the figure and nothing
more: the health a client shows comes from [replication](replication.md), which
this message leaves as it was. A 4.17 client shows nothing at all unless it
holds both the unit hurt and the unit dealing it.

## Death

A champion's death is `ChampionDied`, any other unit's `UnitDied`, and a
building's `BuildingDied`. A 4.17 client ignores `ChampionDied` that credits no
killer, or names a champion already dead, and puts a unit down on `UnitDied`
only where a killer is named. Either can leave the unit standing as a husk
rather than dead, without its death animation or death screen. `ForceDeath` puts
a 4.17 unit into its death.

How long a champion stays down is `DeathTimer`. Whether a client draws the world
without colour while its champion is down is `GreyscaleWhenDead`. What led to a
death is `DeathHistory`, which a client lays out for its player. A server MUST
size each entry as its kind's layout states.

An inhibitor's state, and how long it lasts, is `InhibitorState`. A 4.20 server
also reports a death for what a client draws on its map with `UnitDiedOnMap`.

## Coming back

`Revived` puts a champion back on the field. A 4.17 server can instead bring a
dead champion back at a place of its choosing with `Respawned`, which keeps the
champion's level, gold and spell ranks and restores its health.

## Using a unit

A 4.17 client sends `UseObject` as its player right-clicks a unit that can be
used, and also, for a unit its champion is attacking, as that unit changes side.

## Messages

<!-- messages:begin -->

| Message                                                            | Sent by | 4.17           | 4.20          | What it does                                                                                                                                                                                                   |
| ------------------------------------------------------------------ | ------- | -------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`Attack`](../schema/messages/Attack.json)                         | server  | 12 on events   | 12 on events  | Say a unit is swinging at another                                                                                                                                                                              |
| [`AttackFrom`](../schema/messages/AttackFrom.json)                 | server  | 26 on events   | 26 on events  | Say a unit is swinging at another, carrying where the swinging unit stands as well as what it swings at                                                                                                        |
| [`AttackIndicators`](../schema/messages/AttackIndicators.json)     | server  | 258 on events  | none          | Show or hide a unit's attack indicators                                                                                                                                                                        |
| [`AttackSpeedBounds`](../schema/messages/AttackSpeedBounds.json)   | server  | 288 on events  | 288 on events | Put a ceiling or a floor on how fast a unit attacks                                                                                                                                                            |
| [`BuildingDied`](../schema/messages/BuildingDied.json)             | server  | 137 on events  | 137 on events | What a server sends when a building is destroyed                                                                                                                                                               |
| [`ChampionDied`](../schema/messages/ChampionDied.json)             | server  | 94 on events   | 94 on events  | Say a champion died                                                                                                                                                                                            |
| [`Damage`](../schema/messages/Damage.json)                         | server  | 101 on events  | 101 on events | Say one unit hurt another                                                                                                                                                                                      |
| [`DeathHistory`](../schema/messages/DeathHistory.json)             | server  | 33 on events   | 33 on events  | Say what led to a death, so the client can lay it out                                                                                                                                                          |
| [`DeathTimer`](../schema/messages/DeathTimer.json)                 | server  | 279 on events  | 279 on events | Set how long a champion stays down                                                                                                                                                                             |
| [`ForceDeath`](../schema/messages/ForceDeath.json)                 | server  | 27 on events   | none          | Put a unit into its death                                                                                                                                                                                      |
| [`GreyscaleWhenDead`](../schema/messages/GreyscaleWhenDead.json)   | server  | 169 on events  | 169 on events | Say whether a client draws the world without colour while its champion is down                                                                                                                                 |
| [`GroundAttackMode`](../schema/messages/GroundAttackMode.json)     | server  | 257 on events  | none          | Make a champion's clicks attack the ground                                                                                                                                                                     |
| [`HoverIndicator`](../schema/messages/HoverIndicator.json)         | server  | 246 on events  | none          | Turn a unit's hover indicator on or off                                                                                                                                                                        |
| [`HoverTarget`](../schema/messages/HoverTarget.json)               | server  | 245 on events  | none          | Set the unit a unit's hover indicator points at                                                                                                                                                                |
| [`InhibitorState`](../schema/messages/InhibitorState.json)         | server  | 43 on events   | 43 on events  | Change the state of an inhibitor, and say how long the new state lasts                                                                                                                                         |
| [`Respawned`](../schema/messages/Respawned.json)                   | server  | 74 on events   | none          | Bring a dead champion back at a place, with full health                                                                                                                                                        |
| [`Revived`](../schema/messages/Revived.json)                       | server  | 47 on events   | 47 on events  | Put a champion back on the field                                                                                                                                                                               |
| [`StopAttack`](../schema/messages/StopAttack.json)                 | server  | 52 on events   | 52 on events  | Break off an attack a unit is making                                                                                                                                                                           |
| [`TargetHeldChampion`](../schema/messages/TargetHeldChampion.json) | server  | 192 on events  | 192 on events | Mark that a unit is attacking a champion, or to take the mark away                                                                                                                                             |
| [`TargetUnit`](../schema/messages/TargetUnit.json)                 | server  | 106 on events  | 106 on events | Say what a unit is attacking, whatever the unit attacked is                                                                                                                                                    |
| [`UnitDied`](../schema/messages/UnitDied.json)                     | server  | 158 on events  | 158 on events | Say a unit died, to everyone who can see it                                                                                                                                                                    |
| [`UnitDiedOnMap`](../schema/messages/UnitDiedOnMap.json)           | server  | none           | 294 on events | Say a unit died, for what the client draws on its map rather than on the field                                                                                                                                 |
| [`UseObject`](../schema/messages/UseObject.json)                   | client  | 58 on requests | none          | Use a unit: as its player right-clicks a unit its character data makes usable by them and off its use cooldown, and also as a unit its champion is attacking changes side (TeamChanged), whether usable or not |

<!-- messages:end -->
