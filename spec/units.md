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

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0**
>
> A client builds a prop from the character its `MapProp` names, loading that
> character from its own files when it has not already, and fails soon after the
> prop comes near what it draws where it cannot load it. A server MUST name in
> `MapProp` only characters the client can load.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client drops a `CreateChampion` or a `CreateNeutral` that arrives before it
> sends `CharacterSelected`, reconnecting included. A server MUST send them after
> it receives `CharacterSelected`.

`CharacterPreload` has a client load a character's art ahead of need.

## Changing and removing

`TeamChanged` moves a unit to another side, and `ChampionRemoved` takes a
champion out of the world. A unit's death is in [Combat](combat.md).

## Bots

A server can tell a client what a bot is thinking (`BotDebug`), weighing
(`BotTargets`) or doing (`BotState`).

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> None of `BotDebug`, `BotTargets` and `BotState` changes what a player sees.

<!-- messages -->
