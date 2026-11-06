# The client's data

What a server needs that no message carries, and takes from the files a client
installs: the buildings and spawn points of a map, the ground units walk on,
and the figures of champions, items and spells. A server SHOULD take its
figures from these files: a client draws a match from them, and figures from
elsewhere disagree with what it shows.

## What a server reads

- **The buildings of a map**: the names a client knows its turrets, inhibitors
  and nexuses by, from which [Objects and identifiers](objects.md) works out
  the identifier of each.
- **The spawn points**: where each side's champions begin.
- **The ground**: the grid a map's units walk on, which a server needs to find
  paths.
- **The figures**: each champion's base statistics, each item's price and what
  it is built from, and each spell's cooldowns, costs and ranges, which a server
  states through [replication](replication.md) and `SpellCast`.

<!-- holds from 0.8.13.26 up to 0.9.25.36 -->

> **In 0.8.13.26–0.9.25.35**
>
> A path carries its points as they lie in the world, and takes no origin from
> the ground.

<!-- holds from 1.0.0.58 up to 4.21.0.0 -->

> **In 1.0.0.58–4.20**
>
> [Movement](movement.md) takes the origin of a path from the ground.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> The client has map 1 alone. It loads the map its own game configuration names
> under the key `Mission` of the section `Hacks`, `Map1` where that is absent,
> and no message names the map.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> The client has maps 1, 2 and 3.

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> The client has maps 1, 2, 3 and 4.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> The client has maps 1, 2, 3, 4 and 8.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> The client has maps 1, 2, 3, 4, 6 and 8.

<!-- holds from 3.10.0.237 up to 4.18.0.271 -->

> **In 3.10–4.17**
>
> The client has maps 1, 8, 10 and 12, and no map 11.

<!-- holds from 4.18.0.271 up to 4.20.0.315 -->

> **In 4.18–4.19**
>
> The client has maps 1, 8, 10, 11 and 12. Map 11's buildings are not scene
> objects: its `MapObjects.mob` holds them, named by the same rules, with
> `Turret_OrderTurretShrine` and `Turret_ChaosTurretShrine` for its shrine
> turrets, and the client creates them from it as it does scene objects. Map 11
> has no ground grid.

A client installs its files under one root, with the paths below; an install
that packs them into archives keeps the same paths inside.

**Buildings.** `LEVELS/Map1/Scene/room.dsc` lists a map's scene objects, one
line each: a file name and a quality number. Each object's own file sits beside
it and gives its name. A client creates no object from a name holding
`_Destroyed` or `_FB`. On map 1 the names run `Turret_T<side>_<lane>_<number>`
for a lane turret, `Barracks_T<side>_<lane>1` for an inhibitor and `HQ_T<side>`
for a nexus, side 1 for Order and 2 for Chaos and lanes `L`, `C` and `R`, with a
shrine turret for each side; the numbers differ between the sides, and a server
MUST take the names from the files.

<!-- holds from 0.8.13.26 up to 0.9.25.36 -->

> **In 0.8.13.26–0.9.25.35**
>
> Each object's file is `.sco` as text or `.SCB` as binary, and gives its name
> on its `Name=` line.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A name's opening says what the object is: `Turret` a turret, `Barracks` an
> inhibitor, `HQ_` a nexus. `CreateTurret` names no building of the map: it
> makes a new turret where it says, under the object and character names it
> carries.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> `CreateTurret` names a building by its name alone, compared without regard to
> case, and one naming no building does nothing.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A name's opening says what the object is, the first match winning and a
> minion spawner's tested before `Barracks`: `Turret` a turret, `Barracks` an
> inhibitor, `HQ_` a nexus.

<!-- holds from 1.0.0.58 up to 3.11.0.306 -->

> **In 1.0.0.58–3.10**
>
> A word a name holds anywhere says what the object is, not only its opening,
> the first match winning: a minion spawner's `Spawn_Barracks` is tested before
> `Barracks`, which makes an inhibitor, and `HQ_` makes a nexus and `Turret` a
> turret.

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> `room.dsc` lists each object as a `.sco`, but its file is a binary `.SCB`,
> holding its name within it rather than on a `Name=` line.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> Each object's file is `.sco` as text or `.SCB` as binary, and gives its name
> on its `Name=` line.

<!-- holds from 1.0.0.140 up to 4.20.0.315 -->

> **In 1.0.0.140–4.19**
>
> `CreateTurret` names a building by its name with `_A` after it.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client fails on a `CreateTurret` naming no building, and a server MUST NOT
> send one.

<!-- holds from 3.10.0.237 up to 4.20.0.315 -->

> **In 3.10–4.19**
>
> A `CreateTurret` naming no building does nothing.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> `CreateTurret` compares names exactly, case included.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A name's opening says what the object is: `Turret` a turret, `Barracks`
> without `Spawn` an inhibitor, `HQ_` a nexus. A client creates no object the
> map's object list below already holds.

**Objects and spawn points.** A champion begins at its side's spawn point,
`__Spawn_T1` for Order and `__Spawn_T2` for Chaos.

<!-- holds from 0.8.13.26 up to 3.11.0.306 -->

> **In 0.8.13.26–3.10**
>
> The spawn points, the navigation points and the marker of the level's size are
> scene objects, listed in `room.dsc` like the buildings.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A champion begins on its side's spawn point itself, or at (6000, 0, 6000) on a
> map with none.

<!-- holds from 0.9.25.24 up to 4.20.0.315 -->

> **In 0.9.25.24–4.19**
>
> A champion begins at its side's spawn point moved by an offset from
> `DATA/Characters/HeroSpawnOffsets.inibin`, read from the section `Order<n>` or
> `Chaos<n>` under the keys `Pos<i>` and `Facing<i>`, where i is one more than
> `CreateChampion`'s spawn index. A spawn index of 6 or more begins the champion
> on the spawn point itself.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> In the section's name, n is how many players the side has plus the count
> `SpawnStart` carries, added on both sides alike.

<!-- holds from 1.0.0.140 up to 4.20.0.315 -->

> **In 1.0.0.140–4.19**
>
> In the section's name, n is how many players and bots the side has. A
> champion begun on the spawn point itself faces along +X.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> `LEVELS/Map1/Scene/MapObjects.mob` holds the objects that are not buildings:
> each side's spawn point, the minion spawners, navigation points, the marker of
> the level's size and the props. It opens with 16 bytes: a fixed tag, a 32-bit
> version (2), a 32-bit count and 4 reserved bytes. A record of 128 bytes follows
> for each object: its name, 62 bytes padded with zeros; a byte for its kind; a
> byte that lets it be placed regardless of collision; 32-bit floats for its
> position, rotation and scale (three each) and its bounding box (six); and a
> 32-bit skin.

**The ground.** A client walks units on `LEVELS/Map1/AIPath.aimesh_ngrid`, a
binary grid. Its layout is unspecified.

<!-- holds from 0.8.13.26 up to 3.11.0.306 -->

> **In 0.8.13.26–3.10**
>
> The grid's name is the map's own, `AIPath.aimesh` with `_ngrid` after it: no
> setting of the mode chooses it.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> The grid's name is the one the mode's navigation setting gives.

**The figures.** Each is an inibin file: a champion's base statistics in
`DATA/Characters/<Champion>/<Champion>.inibin`; an item, its price among its
figures, in `DATA/Items/<id>.inibin`; and summoner, item and shared spells in
`DATA/Spells/<Spell>.inibin`.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> A champion's spells and attacks are in `DATA/Spells/<Spell>.inibin` with all
> other spells.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> No map adds items of its own, and there are no figures for a whole mode.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> Map 3 alone adds an `Items.inibin`. `DATA/Globals/` holds figures
> for the whole game in `UnitStats`, `bounty` and `ColorSettings`.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> Map 1 adds `LEVELS/Map1/Items.inibin` to the items, and figures for a whole
> mode are in `DATA/Globals/`, such as `CLASSIC_Stats.inibin` and
> `HealthGain.inibin`.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A champion's spells and attacks are in
> `DATA/Characters/<Champion>/Spells/<Spell>.inibin`.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A champion's spells and attacks are in `DATA/Spells/<Spell>.inibin` with all
> other spells.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> Most champions' spells and attacks are in `DATA/Spells/<Spell>.inibin` with
> all other spells, and some champions' in
> `DATA/Characters/<Champion>/Spells/<Spell>.inibin`.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A champion's spells and attacks are in
> `DATA/Characters/<Champion>/Spells/<Spell>.inibin`.
