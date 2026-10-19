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

`CharacterPreload` has a client load a character's art ahead of need.

## Changing and removing

`TeamChanged` moves a unit to another side, and `ChampionRemoved` takes a
champion out of the world. A unit's death is in [Combat](combat.md).

## Bots

A server can tell a client what a bot is thinking (`BotDebug`), weighing
(`BotTargets`) or doing (`BotState`).

<!-- binding: bots -->

## Messages

<!-- messages:begin -->

| Message                                                          | Sent by | 1.0          | 4.17          | 4.20          | What it does                                                                                  |
| ---------------------------------------------------------------- | ------- | ------------ | ------------- | ------------- | --------------------------------------------------------------------------------------------- |
| [`BotDebug`](../schema/messages/BotDebug.json)                   | server  | none         | 19 on events  | 19 on events  | What a server sends describing what a bot is thinking                                         |
| [`BotState`](../schema/messages/BotState.json)                   | server  | none         | 170 on events | 170 on events | What a server sends naming a bot's state                                                      |
| [`BotTargets`](../schema/messages/BotTargets.json)               | server  | none         | 105 on events | 105 on events | What a server sends naming the units a bot is weighing                                        |
| [`ChampionRemoved`](../schema/messages/ChampionRemoved.json)     | server  | none         | 272 on events | 272 on events | Take a champion out of the world                                                              |
| [`CharacterPreload`](../schema/messages/CharacterPreload.json)   | server  | none         | 138 on events | 138 on events | Have a character and a skin of it loaded ahead of need                                        |
| [`CreateChampion`](../schema/messages/CreateChampion.json)       | server  | 79 on events | 76 on events  | 76 on events  | Put a champion on the field                                                                   |
| [`CreateFollower`](../schema/messages/CreateFollower.json)       | server  | none         | 241 on events | 241 on events | Put an object on the field that follows a unit                                                |
| [`CreateNeutral`](../schema/messages/CreateNeutral.json)         | server  | none         | 99 on events  | 99 on events  | Put a unit that belongs to no side on the field                                               |
| [`CreateTurret`](../schema/messages/CreateTurret.json)           | server  | none         | 157 on events | 157 on events | Put a turret on the field                                                                     |
| [`FollowerMaster`](../schema/messages/FollowerMaster.json)       | server  | none         | 242 on events | 242 on events | Change which unit a following object follows                                                  |
| [`MapProp`](../schema/messages/MapProp.json)                     | server  | none         | 208 on events | 208 on events | Place a prop on the map: a thing that stands there and is looked at rather than one that acts |
| [`MapPropChanged`](../schema/messages/MapPropChanged.json)       | server  | none         | 209 on events | 209 on events | Change something about a prop already on the map                                              |
| [`MarkerMoved`](../schema/messages/MarkerMoved.json)             | server  | none         | 276 on events | 276 on events | Move a marker (SpawnMarker) from one place toward another                                     |
| [`SpawnBot`](../schema/messages/SpawnBot.json)                   | server  | none         | 207 on events | 207 on events | Create a champion played by a bot                                                             |
| [`SpawnFromBarracks`](../schema/messages/SpawnFromBarracks.json) | server  | none         | 3 on events   | 3 on events   | Put a unit on the field from the place its side sends them out of                             |
| [`SpawnMarker`](../schema/messages/SpawnMarker.json)             | server  | none         | 256 on events | 256 on events | Create an unseen object at a place, which other messages can then name                        |
| [`SpawnPet`](../schema/messages/SpawnPet.json)                   | server  | none         | 55 on events  | 55 on events  | Put a pet on the field                                                                        |
| [`SpawnTurret`](../schema/messages/SpawnTurret.json)             | server  | none         | 291 on events | 291 on events | Create a turret of its own choosing                                                           |
| [`SpawnUnit`](../schema/messages/SpawnUnit.json)                 | server  | none         | 124 on events | 124 on events | Put a minion-like unit on the field, such as a ward                                           |
| [`TeamChanged`](../schema/messages/TeamChanged.json)             | server  | none         | 215 on events | 215 on events | Move a unit to another side                                                                   |

<!-- messages:end -->
