# Units

How a server puts objects on the field and takes them away: champions, minions,
neutral monsters, turrets, pets, markers and props. What a unit then does is in
the documents on [movement](movement.md), [combat](combat.md) and
[spells](spells.md), and what it is worth in [replication](replication.md).

Every object is named by a net id. [Objects and identifiers](objects.md) says
how net ids are formed, what a client holds, and what removes each kind of
object.

## Creating

Each kind of object has its own message:

- a champion, `CreateChampion`, which, carrying the client's own client id,
  also makes that champion the client's own; a bot's champion, `SpawnBot`;
- a minion sent out from a side's barracks, `SpawnFromBarracks`, and a unit
  like one, such as a ward, `SpawnUnit`;
- a monster of no side, `CreateNeutral`; a pet, `SpawnPet`;
- a turret the map holds, `CreateTurret`, matched by name against the map's
  own turrets, and a turret of the server's choosing, `SpawnTurret`;
- an object that follows a unit, `CreateFollower`, and a change to what it
  follows, `FollowerMaster`;
- an unseen marker, `SpawnMarker`, which other messages can name and
  `MarkerMoved` moves;
- a prop, a thing that stands on the map and is looked at, `MapProp`, and a
  change to one, `MapPropChanged`.

Several of these arrive on their own or inside the `EnterSight` that brings the
unit into view (see [Vision](vision.md)): a client takes either.

<!-- binding: before-selection -->
<!-- by range -->*Ranges add to this: [4.17](bindings/4-17-0-233/units.md).*

`CharacterPreload` has a client load a character's art ahead of need.

## Changing and removing

`TeamChanged` moves a unit to another side, and `ChampionRemoved` takes a
champion out of the world. A unit's death is in [Combat](combat.md).

## Bots

A server can tell a client what a bot is thinking (`BotDebug`), weighing
(`BotTargets`) or doing (`BotState`).

<!-- binding: bots -->
<!-- by range -->*Ranges add to this: [4.17](bindings/4-17-0-233/units.md).*

## Messages

<!-- messages:begin -->

| Message                                                          | Sent by | Ranges      | What it does                                                                                  |
| ---------------------------------------------------------------- | ------- | ----------- | --------------------------------------------------------------------------------------------- |
| [`BotDebug`](../schema/messages/BotDebug.json)                   | server  | 4.17–4.20   | What a server sends describing what a bot is thinking                                         |
| [`BotState`](../schema/messages/BotState.json)                   | server  | 4.17–4.20   | What a server sends naming a bot's state                                                      |
| [`BotTargets`](../schema/messages/BotTargets.json)               | server  | 4.17–4.20   | What a server sends naming the units a bot is weighing                                        |
| [`ChampionRemoved`](../schema/messages/ChampionRemoved.json)     | server  | 4.17–4.20   | Take a champion out of the world                                                              |
| [`CharacterPreload`](../schema/messages/CharacterPreload.json)   | server  | 4.17–4.20   | Have a character and a skin of it loaded ahead of need                                        |
| [`CreateChampion`](../schema/messages/CreateChampion.json)       | server  | every range | Put a champion on the field                                                                   |
| [`CreateFollower`](../schema/messages/CreateFollower.json)       | server  | 4.17–4.20   | Put an object on the field that follows a unit                                                |
| [`CreateNeutral`](../schema/messages/CreateNeutral.json)         | server  | 4.17–4.20   | Put a unit that belongs to no side on the field                                               |
| [`CreateTurret`](../schema/messages/CreateTurret.json)           | server  | 4.17–4.20   | Put a turret on the field                                                                     |
| [`FollowerMaster`](../schema/messages/FollowerMaster.json)       | server  | 4.17–4.20   | Change which unit a following object follows                                                  |
| [`MapProp`](../schema/messages/MapProp.json)                     | server  | 4.17, 4.20  | Place a prop on the map: a thing that stands there and is looked at rather than one that acts |
| [`MapPropChanged`](../schema/messages/MapPropChanged.json)       | server  | 4.17, 4.20  | Change something about a prop already on the map                                              |
| [`MarkerMoved`](../schema/messages/MarkerMoved.json)             | server  | 4.17–4.20   | Move a marker (SpawnMarker) from one place toward another                                     |
| [`SpawnBot`](../schema/messages/SpawnBot.json)                   | server  | 4.17–4.20   | Create a champion played by a bot                                                             |
| [`SpawnFromBarracks`](../schema/messages/SpawnFromBarracks.json) | server  | 4.17–4.20   | Put a unit on the field from the place its side sends them out of                             |
| [`SpawnMarker`](../schema/messages/SpawnMarker.json)             | server  | 4.17–4.20   | Create an unseen object at a place, which other messages can then name                        |
| [`SpawnPet`](../schema/messages/SpawnPet.json)                   | server  | 4.17–4.20   | Put a pet on the field                                                                        |
| [`SpawnTurret`](../schema/messages/SpawnTurret.json)             | server  | 4.17–4.20   | Create a turret of its own choosing                                                           |
| [`SpawnUnit`](../schema/messages/SpawnUnit.json)                 | server  | 4.17–4.20   | Put a minion-like unit on the field, such as a ward                                           |
| [`TeamChanged`](../schema/messages/TeamChanged.json)             | server  | 4.17–4.20   | Move a unit to another side                                                                   |

<!-- messages:end -->
