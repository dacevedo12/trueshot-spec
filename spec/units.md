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

<!-- binding: props -->

<!-- binding: before-selection -->

`CharacterPreload` has a client load a character's art ahead of need.

## Changing and removing

`TeamChanged` moves a unit to another side, and `ChampionRemoved` takes a
champion out of the world. A unit's death is in [Combat](combat.md).

## Bots

A server can tell a client what a bot is thinking (`BotDebug`), weighing
(`BotTargets`) or doing (`BotState`).

<!-- binding: bots -->

<!-- messages -->
