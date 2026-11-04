# The client's data

What a server needs that no message carries, and takes from the files a client
installs: the buildings and spawn points of a map, the ground units walk on,
and the figures of champions, items and spells. None of this is carried on
the wire. A server SHOULD take its figures from these files: a client draws a
match from them, and figures from elsewhere disagree with what it shows.

## What a server reads

- **The buildings of a map**: the names a client knows its turrets, inhibitors
  and nexuses by, which `CreateTurret` names and from which [Objects and
  identifiers](objects.md) works out the identifier of each.
- **The spawn points**: where each side's champions begin, which
  `CreateChampion` places them at by their index.
- **The ground**: the grid a map's units walk on, which a server needs to find
  paths and from which [Movement](movement.md) takes the origin of a path.
- **The figures**: each champion's base statistics, each item's price and what
  it is built from, and each spell's cooldowns, costs and ranges, which a server
  states through [replication](replication.md) and `SpellCast`.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
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

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client installs its files under one root, with the paths below; an install
> that packs them into archives keeps the same paths inside.
>
> **Buildings.** `LEVELS/Map1/Scene/room.dsc` lists a map's scene objects, one
> line each: a file name and a quality number. Each object's own file, `.sco` as
> text or `.SCB` as binary, sits beside it and gives its name on its `Name=`
> line. A name's opening says what the object is: `Turret` a turret, `Barracks`
> without `Spawn` an inhibitor, `HQ_` a nexus. A client creates no object from a
> name holding `_Destroyed` or `_FB`, nor one the map's object list below already
> holds. On map 1 the names run `Turret_T<side>_<lane>_<number>` for a lane
> turret, `Barracks_T<side>_<lane>1` for an inhibitor and `HQ_T<side>` for a
> nexus, side 1 for Order and 2 for Chaos and lanes `L`, `C` and `R`, with a
> shrine turret for each side; the numbers differ between the sides, and a
> server MUST take the names from the files. `CreateTurret` names a building by
> its name with `_A` after it, and one naming no building does nothing.
>
> **Objects and spawn points.** `LEVELS/Map1/Scene/MapObjects.mob` holds the
> objects that are not buildings: each side's spawn point, `__Spawn_T1` and
> `__Spawn_T2`, the minion spawners, navigation points, the marker of the level's
> size and the props. It opens with 16 bytes: a fixed tag, a 32-bit version (2),
> a 32-bit count and 4 reserved bytes. A record of 128 bytes follows for each
> object: its name, 62 bytes padded with zeros; a byte for its kind; a byte that
> lets it be placed regardless of collision; 32-bit floats for its position,
> rotation and scale (three each) and its bounding box (six); and a 32-bit skin.
>
> A champion begins at its side's spawn point moved by an offset from
> `DATA/Characters/HeroSpawnOffsets.inibin`, read from the section `Order<n>` or
> `Chaos<n>`, where n is how many players and bots the side has, under the keys
> `Pos<i>` and `Facing<i>`, where i is one more than `CreateChampion`'s spawn
> index. A spawn index of 6 or more begins the champion on the spawn point
> itself, facing along +X.
>
> **The ground.** A client walks units on `LEVELS/Map1/AIPath.aimesh_ngrid`, a
> binary grid whose name the mode's navigation setting gives. Its layout is
> unspecified.
>
> **The figures.** Each is an inibin file: a champion's base statistics in
> `DATA/Characters/<Champion>/<Champion>.inibin`; an item, its price among its
> figures, in `DATA/Items/<id>.inibin`, with map 1 adding
> `LEVELS/Map1/Items.inibin`; a champion's spells and attacks in
> `DATA/Characters/<Champion>/Spells/<Spell>.inibin`; summoner, item and shared
> spells in `DATA/Spells/<Spell>.inibin`; and figures for a whole mode in
> `DATA/Globals/`, such as `CLASSIC_Stats.inibin` and `HealthGain.inibin`.
