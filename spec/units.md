# Units

How a server puts objects on the field and takes them away: champions, minions,
neutral monsters, turrets, pets, markers and props. What a unit then does is in
the documents on [movement](movement.md), [combat](combat.md) and
[spells](spells.md), and what it is worth in [replication](replication.md).
Applies to 4.20 clients, as [Versions](versions.md) describes.

## Ids

Every object is named by an id, which the messages about it carry in their
header or in their body. A server picks the ids of what it creates. Objects the
map already holds, its buildings and the points minions come from, have ids the
map's own names give them, which [Messages](messages.md) sets out under objects
a map names.

A 4.17 client that is told to create an object under an id it already holds
first deletes what held it, for every message here that creates one.

## Creating

Each kind of object has its own message:

- a champion, `CreateChampion`, which for the client's own seat also makes that
  champion the client's own; a bot's champion, `SpawnBot`;
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
unit into view (see [Vision](vision.md)): a 4.17 client takes either.

A 4.17 client drops a `CreateChampion` or a `CreateNeutral` that arrives before
it sends `CharacterSelected`, reconnecting included. A server MUST send them
after it receives `CharacterSelected`.
`CharacterPreload` has a 4.17 client load a character's art ahead of need.

## Changing and removing

`TeamChanged` moves a unit to another side, and `ChampionRemoved` takes a
champion out of the world. A unit's death is in [Combat](combat.md).

## Bots

A server can tell a 4.17 client what a bot is thinking (`BotDebug`), weighing
(`BotTargets`) or doing (`BotState`). None of them changes what a player
sees.

## Messages

<!-- messages:begin -->

| Message                                                          | Sent by | 4.20          | What it does                                                                                  |
| ---------------------------------------------------------------- | ------- | ------------- | --------------------------------------------------------------------------------------------- |
| [`CreateChampion`](../schema/messages/CreateChampion.json)       | server  | 76 on events  | Put a champion on the field                                                                   |
| [`CreateNeutral`](../schema/messages/CreateNeutral.json)         | server  | 99 on events  | Put a unit that belongs to no side on the field                                               |
| [`CreateTurret`](../schema/messages/CreateTurret.json)           | server  | 157 on events | Put a turret on the field                                                                     |
| [`MapProp`](../schema/messages/MapProp.json)                     | server  | 208 on events | Place a prop on the map: a thing that stands there and is looked at rather than one that acts |
| [`MapPropChanged`](../schema/messages/MapPropChanged.json)       | server  | 209 on events | Change something about a prop already on the map                                              |
| [`SpawnFromBarracks`](../schema/messages/SpawnFromBarracks.json) | server  | 3 on events   | Put a unit on the field from the place its side sends them out of                             |

<!-- messages:end -->
