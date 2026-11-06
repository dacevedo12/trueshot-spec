# Objects and identifiers

How the things a match is about are named on the wire, and when an object
enters and leaves a client's world.

## The identifiers

| Identifier | Width                  | Formed                                                                                | No one            |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------- | ----------------- |
| Player id  | 64 bits, signed        | the player's account; a client is given its own when started                          | -1, every bit set |
| Client id  | 32 bits, unsigned      | chosen by the server for each player at registration, counting from 0                 | 4294967295        |
| Seat       | a place in a side list | the order of a side's player ids in `Roster`                                          | an empty place    |
| Net id     | 32 bits, unsigned      | chosen by the server for what it creates; worked out from a name for what a map holds | 0                 |
| Node       | 8 bits, unsigned       | the owning client's client id plus 1, or 0 for an object no client owns               | 0                 |
| Region id  | 32 bits, unsigned      | chosen by the server for each region, and carried by `RegionAdded`                    | see below         |
| Name hash  | 32 bits, unsigned      | worked out from the name of a spell, an effect, a particle or a bone                  | 0                 |

A field's own definition gives its exact type. Where a field carries one of
these, it carries it whole, at the width above.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> No region id stands for no region.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A region id of 0 names no region: given a `RegionAdded` carrying 0, a client
> gives the region an id of its own, its own node in the top byte and a count
> below it, which no message from a server can name.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> No region id stands for no region.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A region id of 0 names no region: given a `RegionAdded` carrying 0, a client
> gives the region an id of its own, its own node in the top byte and a count
> below it, which no message from a server can name.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> No region id stands for no region.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A region id of 0 names no region: given a `RegionAdded` carrying 0, a client
> gives the region an id of its own, its own node in the top byte and a count
> below it, which no message from a server can name.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> No region id stands for no region.

A server MUST give each player a client id from 0 to 252.

<!-- holds from 0.8.13.26 up to 3.11.0.306 -->

> **In 0.8.13.26–3.10**
>
> A client takes a client id only from 0 to 252, and leaves on any other.

## How they relate

A player is known by a player id. A server answers a client's `Register` with
`Registered`, and the one carrying the client's own player id gives the client
its own client id.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client acts on that `Registered` alone and ignores every other, so it pairs
> no other player's player id with a client id. A server MUST send it before any
> create message, because a client given a create message before it has its
> own client id stops.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> Registration pairs each player id with a client id: a server answers a
> client's `Register` with one `Registered` for every seat. Every later message
> that names a player by client id is read through that pairing.

<!-- holds from 1.0.0.58 up to 3.11.0.306 -->

> **In 1.0.0.58–3.10**
>
> A client acts on that `Registered` alone and ignores every other, so it pairs
> no other player's player id with a client id.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A server MUST send that `Registered` before any create message, because a
> client given a create message before it has its own client id stops.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Registration pairs each player id with a client id: a server answers a
> client's `Register` with one `Registered` for every seat. Every later message
> that names a player by client id is read through that pairing.

`Roster` lists each side's player ids in order, and a player's seat is their
place in that list. A client finds a seat's client id through its player id.
`SeatName`, `SeatChampion` and the `VersionSync` seats name a player by player
id; `SeatLoadProgress` names both.

A champion carries the client id of the player it belongs to. The
`CreateChampion` carrying a client's own client id makes that champion the
client's own.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A bot's champion carries 4294967295.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> A client tells a bot's champion by a byte of its own, not by its client id.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> A bot's champion carries 4294967295.

## Net ids

A net id names one object in a client's world: a unit, a missile, a particle,
a marker, a prop. The header of every game message carries one, and fields
naming a unit, an owner or a target carry one too.

- A server MUST NOT give an object net id 0, which names nothing.
- A server SHOULD NOT give an object a net id whose top byte is 0xFF, which the
  identifiers of what a map holds use, nor one whose top byte is any client's
  client id plus 1, which a client uses for objects of its own making.
- A server MUST NOT give a new object a net id it has given another object in
  the same match, except in a soft reconnect (see below).

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client given a create message for a net id it already holds stops.

<!-- holds from 0.9.25.24 up to 1.0.0.61 -->

> **In 0.9.25.24–1.0.0.60**
>
> A client that still holds the earlier object gives the net id to the new one,
> so messages naming it reach the new object, and removing either leaves the id
> naming neither.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> A client that still holds the earlier object creates the new one but keeps
> the net id on the old one, so messages naming it reach the old object, and
> removing either leaves the id naming neither.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> `CreateChampion` and `CreateTurret` remove any object holding the net id
> before they create theirs. For any other creating message, a client that
> still holds the earlier object creates the new one but keeps the net id on the
> old one, so messages naming it reach the old object, and removing either
> leaves the id naming neither. Between its own reconnection and
> `ResyncEnded`, a client drops a `SpawnFromBarracks`, `SpawnUnit` or
> `CreateNeutral` naming a net id it holds.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client that still holds the earlier object creates the new one but keeps
> the net id on the old one, so messages naming it reach the old object, and
> removing either leaves the id naming neither.

A create message carries a node beside the object's net id.

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> Nothing a player sees depends on it.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client applies a `SpawnPet`'s effect and spell level only where the owner's
> node is its own.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> Nothing a player sees depends on it.

## Net ids of what a map holds

Some objects are on the field before any message puts them there, and no
message ever does: the buildings a side defends, the shops beside them, and
the spawn points a side's minions come from. A receiving end knows them from
the map it loaded, and every message naming one names it by an identifier
worked out from that object's name in the map.

The identifier is the CRC-32 of the name, with the top byte set:

```text
identifier = crc32(name) | 0xFF000000
```

The name is taken byte for byte with its case kept, so `OrderShop01` and
`orderShop01` are two names and give two identifiers. The CRC-32 is the common
one: the polynomial 0x04C11DB7 read reflected, starting from 0xFFFFFFFF and
finishing with every bit inverted, so the nine bytes `123456789` give
0xCBF43926.

Among the identifiers with that top byte are these:

| Name                              | Identifier   |
| --------------------------------- | ------------ |
| `Barracks_T1_C1`                  | `0xFF4A20F1` |
| `Barracks_T1_L1`                  | `0xFFD23C3E` |
| `Barracks_T1_R1`                  | `0xFF9303E1` |
| `Barracks_T2_C1`                  | `0xFFFF8F1F` |
| `Barracks_T2_L1`                  | `0xFF6793D0` |
| `Barracks_T2_R1`                  | `0xFF26AC0F` |
| `__P_Order_Spawn_Barracks__C01`   | `0xFFB77171` |
| `__P_Order_Spawn_Barracks__L01`   | `0xFFEB364C` |
| `__P_Order_Spawn_Barracks__R01`   | `0xFF53B836` |
| `__P_Chaos_Spawn_Barracks__C01`   | `0xFFBA00E8` |
| `__P_Chaos_Spawn_Barracks__L01`   | `0xFFE647D5` |
| `__P_Chaos_Spawn_Barracks__R01`   | `0xFF5EC9AF` |
| `____P_Chaos_Spawn_Barracks__C01` | `0xFF707D61` |
| `ChaosShop01`                     | `0xFF3A98D9` |
| `chaosShop01`                     | `0xFFA6170E` |
| `HQ_T1`                           | `0xFFF97DB5` |
| `HQ_T2`                           | `0xFFF02C0F` |
| `OrderShop01`                     | `0xFF8C490C` |
| `orderShop01`                     | `0xFF10C6DB` |

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> Map 1 holds the six `Barracks` names, `HQ_T1`, `HQ_T2`, the six spawn points
> named `__P_Order_Spawn_Barracks__` and `__P_Chaos_Spawn_Barracks__` with
> `C01`, `L01` or `R01`, and the shops `OrderShop01` and `ChaosShop`, whose
> identifier is 4279618595. Its turret buildings carry the identifiers their
> names give too: `Turret_T1_C_00` to `Turret_T1_C_07`, `Turret_T1_L_02`,
> `Turret_T1_L_03`, `Turret_T1_R_02`, `Turret_T1_R_03`, `Turret_T2_C_00` to
> `Turret_T2_C_05`, `Turret_T2_L_01` to `Turret_T2_L_03`, and `Turret_T2_R_01`
> to `Turret_T2_R_03`.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> Every object a map places carries the identifier its name gives, turrets,
> navigation points and props among them.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> | Map  | Holds                                                                                                                                                                                                                                 |
> | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | 1, 2 | the six `Barracks` names, `HQ_T1`, `HQ_T2`, `orderShop01`, `chaosShop01`, the six spawn points named `__P_…`, and turrets named `Turret_T1_…` and `Turret_T2_…`, `Turret_OrderTurretShrine` and `Turret_ChaosTurretShrine` among them |
> | 3    | `Barracks_T1_C1`, `Barracks_T2_C1`, `HQ_T1`, `HQ_T2`, `OrderShop01`, `ChaosShop01`, `____P_Chaos_Spawn_Barracks__C01`, and turrets, `Turret_T1_C_08` among them                                                                       |

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> | Map  | Holds                                                                                                                  |
> | ---- | ---------------------------------------------------------------------------------------------------------------------- |
> | 1, 2 | the six `Barracks` names, `HQ_T1`, `HQ_T2`, `orderShop01`, `chaosShop01`, the six spawn points named `__P_…`           |
> | 3    | `Barracks_T1_C1`, `Barracks_T2_C1`, `HQ_T1`, `HQ_T2`, `OrderShop01`, `ChaosShop01`, `____P_Chaos_Spawn_Barracks__C01`  |
> | 4    | `Barracks_T1_L1`, `Barracks_T1_R1`, `Barracks_T2_L1`, `Barracks_T2_R1`, `HQ_T1`, `HQ_T2`, `OrderShop01`, `chaosShop01` |

<!-- holds from 1.0.0.126 up to 3.11.0.306 -->

> **In 1.0.0.126–3.10**
>
> A name holding `_Destroyed` or `_FB` gives no identifier.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> | Name                                                                   | Maps       |
> | ---------------------------------------------------------------------- | ---------- |
> | `Barracks_T1_C1`, `Barracks_T2_C1`                                     | 1, 2, 3    |
> | `Barracks_T1_L1`, `Barracks_T1_R1`, `Barracks_T2_L1`, `Barracks_T2_R1` | 1, 2, 4    |
> | the six spawn points named `__P_…`                                     | 1, 2       |
> | `____P_Chaos_Spawn_Barracks__C01`                                      | 3          |
> | `HQ_T1`, `HQ_T2`                                                       | 1, 2, 3, 4 |
> | `OrderShop01`                                                          | 3, 4       |
> | `orderShop01`                                                          | 1, 2, 8    |
> | `ChaosShop01`                                                          | 3          |
> | `chaosShop01`                                                          | 1, 2, 8    |

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> | Map     | Holds                                                                                                                                              |
> | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
> | 1, 2, 6 | the six `Barracks` names, `HQ_T1`, `HQ_T2`, `orderShop01`, `chaosShop01`, spawn points named `__P_…`                                               |
> | 3       | `Barracks_T1_C1`, `Barracks_T2_C1`, `HQ_T1`, `HQ_T2`, `OrderShop01`, `ChaosShop01`, `____P_Chaos_Spawn_Barracks__C01`                              |
> | 4       | `Barracks_T1_L1`, `Barracks_T1_R1`, `Barracks_T2_L1`, `Barracks_T2_R1`, `HQ_T1`, `HQ_T2`, `OrderShop01`, `ChaosShop01`, spawn points named `__P_…` |
> | 8       | `orderShop01`, `chaosShop01`                                                                                                                       |

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> | Map | Holds                                                                                                                                                                  |
> | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | 1   | the six `Barracks` names, the six spawn points named `__P_…`, `HQ_T1`, `HQ_T2`, `orderShop01`, `chaosShop01`                                                           |
> | 8   | `orderShop01`, `chaosShop01`                                                                                                                                           |
> | 10  | `Barracks_T1_L1`, `Barracks_T1_R1`, `Barracks_T2_L1`, `Barracks_T2_R1`, the `L01` and `R01` spawn points of both sides, `HQ_T1`, `HQ_T2`, `orderShop01`, `chaosShop01` |
> | 12  | `Barracks_T1_C1`, `Barracks_T2_C1`, the `C01` spawn points of both sides named `____P_…`, `HQ_T1`, `HQ_T2`, `OrderShop01`, `ChaosShop01`                               |

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> | Name                            | `map`         |
> | ------------------------------- | ------------- |
> | `Barracks_T1_C1`                | 1, 11, 12     |
> | `Barracks_T1_L1`                | 1, 10, 11     |
> | `Barracks_T1_R1`                | 1, 10, 11     |
> | `Barracks_T2_C1`                | 1, 11, 12     |
> | `Barracks_T2_L1`                | 1, 10, 11     |
> | `Barracks_T2_R1`                | 1, 10, 11     |
> | `__P_Order_Spawn_Barracks__C01` | 1             |
> | `ChaosShop01`                   | 12            |
> | `chaosShop01`                   | 1, 8, 10, 11  |
> | `HQ_T1`                         | 1, 10, 11, 12 |
> | `HQ_T2`                         | 1, 10, 11, 12 |
> | `OrderShop01`                   | 12            |
> | `orderShop01`                   | 1, 8, 11      |

The `Barracks` names above belong to inhibitors, whatever the name says. The
minions a side sends out come from spawn points of their own, which are among
the objects a map holds.

A client puts a minion on the field for a `SpawnFromBarracks` naming a spawn
point, and creates nothing for one naming an inhibitor such as
`Barracks_T1_C1`.

A server MUST name each object a map holds by the identifier its name gives.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> `CreateTurret` creates a turret of its own at the place its body gives,
> rather than naming one the map holds. `PlaceTurret`, whose header names a
> turret building the map holds, creates a new turret at that building's place:
> the building keeps its own identifier, and each `PlaceTurret` makes another
> turret.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> `CreateTurret` gives a net id to a turret the map already holds, matched by
> name. Given to a turret that already has one, it gives it a second, and both
> name it.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> `CreateTurret` matches a turret's name without regard to case, and does
> nothing where the map holds no turret of that name.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> `CreateTurret` first removes any object holding its net id. It matches a
> turret's name exactly, case included, and the name it carries is the
> building's name followed by a two-character suffix. A name no turret has does
> nothing.

## What a client holds

A client holds an object from the message that creates it until the message,
or the end of its life, that removes it. Creating messages are listed in
[Units](units.md). What a map holds, a client holds from the moment it loads
the map.

<!-- holds from 0.8.13.26 up to 1.0.0.127 -->

> **In 0.8.13.26–1.0.0.126**
>
> `EnterSight` and `EnterLocalSight` carry no other message, and act only on a
> unit the client already holds.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Several creating messages can arrive inside the `EnterSight` that brings a
> unit into view.

Leaving a client's sight removes nothing: `LeaveSight` and `LeaveTeamSight`
hide an object, and it is held as before.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> `LeaveLocalSight` hides an object too, and it is held as before.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> `LeaveLocalSight` does nothing.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> `LeaveLocalSight` hides an object too, and it is held as before.

<!-- holds from 0.8.13.26 up to 0.9.25.36 -->

> **In 0.8.13.26–0.9.25.35**
>
> A new `SpawnPet` for an owner removes that owner's pet before it.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A client removes a nexus about 4 seconds after `BuildingDied` names it, and
> can fail as it does. An inhibitor `BuildingDied` names is held.

<!-- holds from 1.0.0.96 up to 3.11.0.306 -->

> **In 1.0.0.96–3.10**
>
> A client removes a region once its lifetime reaches 0, so a region given a
> lifetime of 0 does not last.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> `RegionRemoved` for a region a client does not hold does nothing.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> No message removes a champion.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> How each kind leaves a client's world:
>
> | Kind                 | Removed                                                                                                                                                                               | Its death                                                               |
> | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
> | Champion             | by `ChampionRemoved`, at once                                                                                                                                                         | kills it; it is held, and comes back                                    |
> | Minion, monster, pet | by the client, once it has been dead for its death time, 4 seconds unless its character says otherwise; a new `SpawnPet` for an owner removes that owner's pet before it              | starts that wait; a death naming no killer does nothing                 |
> | Turret               | by the client, 1.2 seconds after its death, or after the time its `SpawnTurret` gives; a lane turret is held where `VersionSync`'s features keep destroyed turrets (`turretsPersist`) | kills it                                                                |
> | Inhibitor, nexus     | never                                                                                                                                                                                 | `BuildingDied` plays its death; it is held, and an inhibitor comes back |
> | Missile              | by `DestroyMissile`, by its flight ending, or once its caster is removed                                                                                                              |                                                                         |
> | Particle             | by `KillParticle`, naming it in its body, or once its effect ends                                                                                                                     |                                                                         |
> | Follower             | once the unit it follows is removed                                                                                                                                                   |                                                                         |
> | Marker               | only by a soft reconnect                                                                                                                                                              |                                                                         |
> | Region               | by `RegionRemoved`, once its lifetime runs out (a lifetime of 0 never does), or once the unit it follows is removed                                                                   |                                                                         |

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client fails on a `RegionMoved` naming a region it does not hold, one whose
> lifetime has run out included, and a server MUST NOT send one.

### A soft reconnect

`SoftReconnect` rebuilds a client's world without a new connection, in two
halves. The first marks every unit and every object kept until a checkpoint,
inhibitors aside. A create message for a marked net id replaces the marked
object rather than keeping the id on it. The second removes every object still
marked. In between, a server sends again each object the client is to keep.
Of the stages, one marks and any other removes.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> The stage of `SoftReconnect` that marks is 0.

<!-- holds from 4.18.0.271 up to 4.21.0.0 -->

> **In 4.18–4.20**
>
> The stage of `SoftReconnect` that marks is 1.

## Messages about objects a client does not hold

A message whose header names a net id the client does not hold, or whose body
names one it needs, does nothing, and the client answers nothing for it.
Creating messages are the exception, and so are these:

- `CreateFollower` does nothing where the unit it follows is not held.
- A `Replication` batch skips the units a client does not hold, and goes
  unanswered (see [Ordering](ordering.md)).
- `SoundPlayed` naming an owner the client does not hold plays the sound with
  no place.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> `SpawnPet` names the pet's owner in its header and carries the new pet's net
> id in its body, and does nothing where that owner is not held.

<!-- holds from 0.9.25.24 up to 1.0.0.61 -->

> **In 0.9.25.24–1.0.0.60**
>
> A client sends a `WaypointGroup`'s `WaypointAck` before it reads any path,
> whatever units the paths name. A path for a unit not held is read through and
> dropped, and is not applied once an object takes that net id.

<!-- holds from 1.0.0.96 up to 1.0.0.141 -->

> **In 1.0.0.96–1.0.0.140**
>
> A `WaypointGroup` or `WaypointGroupAtSpeed` path for a unit not held is never
> applied, and a client does not read past its points: it reads the next path
> from inside the one it skipped, so every later path of that message comes out
> wrong. The `WaypointAck` is sent as usual and lists that path. A server MUST
> send the creating message first, and MUST NOT carry a path for a unit a
> client does not hold in a message with other paths.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> `SpawnPet` takes the net id in its header for the new pet, but does nothing
> where the owner its body names is not held.

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> A `WaypointGroup` or `WaypointGroupAtSpeed` path for a unit not yet held is
> applied once an object takes that net id, and its `WaypointAck` is sent as
> usual. A server SHOULD send the creating message first.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> `EnterSight` and `EnterLocalSight` act on the messages they carry whether or
> not the client holds the unit they name.

Nothing else is held back for later: a message that arrives before the
message creating what it names is lost. [Ordering](ordering.md)
says what that requires of a server.

## A message naming its sender

A server MUST set any field naming the sender from the connection the message
arrived on, and MUST NOT copy the value the message carried; otherwise one
player can send messages every other client attributes to another.

## Name hashes

Some things a message names are known to a client by name: a spell, an effect
a unit carries, a particle, and a place on a unit that particles hang from. A
message names one of these by a number worked out from its name.

The number is the ELF hash of the name with its capital letters lowered:

```text
number = 0
for each byte b of the name, with A to Z made a to z:
    number = (number << 4) + b
    high = number & 0xF0000000
    if high != 0:
        number = number ^ (high >> 24)
    number = number & ~high
```

Every step is worked in 32 bits. Only `A` to `Z` change, so `SummonerFlash`
and `summonerflash` give one number. A particle's name includes its extension,
so the number comes from `global_ss_flash.troy` and not from
`global_ss_flash`. The nine bytes `123456789` give 0x0678AEE9.

<!-- holds from 0.8.13.26 up to 3.11.0.306 -->

> **In 0.8.13.26–3.10**
>
> A byte from 128 to 255 enters the hash as its value less 256, worked in 32
> bits, rather than as itself.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Every byte other than `A` to `Z` is taken as it is.

| Name                      | Number       |
| ------------------------- | ------------ |
| `SummonerFlash`           | `0x06496EA8` |
| `RegenerationPotion`      | `0x0E75DC7E` |
| `EzrealMysticShotMissile` | `0x05FE9CE5` |
| `global_ss_flash.troy`    | `0x0058E369` |
| `L_HAND`                  | `0x0725E844` |

A server MUST name each such thing by the number its name gives.
