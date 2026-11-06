# Units

How a server puts objects on the field and takes them away: champions, minions,
neutral monsters, turrets, pets, markers and props. What a unit then does is in
[Movement](movement.md), [Combat](combat.md) and [Spells](spells.md), and what
it is worth in [Replication](replication.md).

Every object is named by a net id, and
[Objects and identifiers](objects.md) says what removes each kind of object.

## Creating

Each kind of object has its own message:

- a champion, `CreateChampion`, which, carrying the client's own client id,
  also makes that champion the client's own; a bot's champion, the same
  `CreateChampion` naming no client, or `SpawnBot`;
- a minion sent out from a side's barracks, `SpawnFromBarracks`, and a unit
  like one, such as a ward, `SpawnUnit`;
- a monster of no side, `CreateNeutral`; a pet, `SpawnPet`;
- a turret, `CreateTurret` ([The client's data](data.md) says how it names
  one), and a turret of the server's choosing, `SpawnTurret`;
- an object that follows a unit, `CreateFollower`, and a change to what it
  follows, `FollowerMaster`;
- an unseen marker, `SpawnMarker`, which other messages can name and
  `MarkerMoved` moves;
- a prop, a thing that stands on the map and is looked at, `MapProp`, and a
  change to one, `MapPropChanged`.

<!-- holds from 1.0.0.138 up to 4.21.0.0 -->

> **In 1.0.0.138–4.20**
>
> Several of these arrive on their own or inside the `EnterSight` that brings
> the unit into view (see [Vision](vision.md)): a client takes either.

`CharacterPreload` has a client load a character's art ahead of need.

<!-- holds from 0.8.13.26 up to 1.0.0.61 -->

> **In 0.8.13.26–1.0.0.60**
>
> A client acts on a `CreateChampion` or a `CreateNeutral` whenever it arrives,
> before `CharacterSelected` as after.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> A client drops a `CreateChampion` or a `CreateNeutral` that arrives before it
> has loaded the map's ground grid, which it loads while loading the match.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client acts on a `CreateChampion` or a `CreateNeutral` whenever it arrives.
> Once it has reconnected, it drops a `SpawnFromBarracks`, `SpawnUnit` or
> `CreateNeutral` for an object it already holds.
>
> A client builds a prop from the character its `MapProp` names, loading that
> character from its own files when it has not already, and fails soon after the
> prop comes near what it draws where it cannot load it. A server MUST name in
> `MapProp` only characters the client can load.

<!-- holds from 3.10.0.237 up to 4.20.0.315 -->

> **In 3.10–4.19**
>
> A client drops a `CreateChampion` or a `CreateNeutral` that arrives before it
> sends `CharacterSelected`, reconnecting included. A server MUST send them after
> it receives `CharacterSelected`.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client drops a `CreateChampion` or a `CreateNeutral` that arrives before it
> has loaded the map's ground grid.

## Changing and removing

`TeamChanged` moves a unit to another side, and `ChampionRemoved` takes a
champion out of the world. A unit's death is in [Combat](combat.md).

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client leaves the match when `ChampionRemoved` names its own champion. A
> server MUST NOT send `ChampionRemoved` for a client's own champion.

## Bots

A server can tell a client what a bot is thinking (`BotDebug`), weighing
(`BotTargets`) or doing (`BotState`). None of them changes what a player sees.

<!-- messages -->
