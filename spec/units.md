# Units

How a server puts objects on the field and takes them away: champions, minions,
neutral monsters, turrets, pets, markers and props. What a unit then does is in
[Movement](movement.md), [Combat](combat.md) and [Spells](spells.md), and what
it is worth in [Replication](replication.md).

Every object is named by a net id, and
[Objects and identifiers](objects.md) says what removes each kind of object.

## Creating

Each kind of object has its own message:

- a champion, `CreateChampion` ([Objects and identifiers](objects.md#how-they-relate)
  says which is the client's own); a bot's champion, the same `CreateChampion`
  naming no client, or `SpawnBot`;
- a minion sent out from a side's barracks, `SpawnFromBarracks`, and a unit
  like one, such as a ward, `SpawnUnit`;
- a monster of no side, `CreateNeutral`; a pet, `SpawnPet`;
- a turret, `CreateTurret` ([Objects and identifiers](objects.md#net-ids-of-what-a-map-holds)
  says how it names one), and a turret of the server's choosing, `SpawnTurret`;
- an object that follows a unit, `CreateFollower`, and a change to what it
  follows, `FollowerMaster`;
- an unseen marker, `SpawnMarker`, which other messages can name and
  `MarkerMoved` moves;
- a prop, a thing that stands on the map and is looked at, `MapProp`, and a
  change to one, `MapPropChanged`.

[Vision](vision.md) says which of these can arrive inside an `EnterSight`, and
[Joining a match](joining.md#the-spawn-run) what a client drops before it sends
`CharacterSelected`. [Leaving and coming back](match.md#leaving-and-coming-back)
says which of them a client ignores while it resynchronises.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> A client drops a `CreateChampion` or a `CreateNeutral` that arrives before it
> has loaded the map's ground grid, which it loads while loading the match.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client acts on a `CreateChampion` or a `CreateNeutral` whenever it arrives.
>
> A client builds a prop from the character its `MapProp` names, loading that
> character from its own files when it has not already, and fails soon after the
> prop comes near what it draws where it cannot load it. A server MUST name in
> `MapProp` only characters the client can load.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client drops a `CreateChampion` or a `CreateNeutral` that arrives before it
> has loaded the map's ground grid.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client drops a `CreateChampion` or a `CreateNeutral` that arrives before it
> has loaded the map's ground grid.

`CharacterPreload` has a client load a character's art ahead of need.

## Changing and removing

`TeamChanged` moves a unit to another side, and `ChampionRemoved` takes a
champion out of the world. A unit's death is in [Combat](combat.md).

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> `ChampionRemoved` naming a client's own champion removes it as any other, and
> the client is left with no champion of its own; it stays in the match.

## Bots

A server can tell a client what a bot is thinking (`BotDebug`), weighing
(`BotTargets`) or doing (`BotState`). None of them changes what a player sees.

<!-- messages -->
