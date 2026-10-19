# Objects and identifiers

How the things a match is about are named on the wire, and what a client holds
of them: the identifiers every system uses, how they relate, and when an
object comes into a client's world and leaves it. A message that names
something a client does not hold does nothing, so a server's messages agree
with each other only where they agree with this document.

## The identifiers

| Identifier | Width                  | Formed                                                                                | No one            |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------- | ----------------- |
| Player id  | 64 bits, signed        | the player's account; a client is given its own when started                          | -1, every bit set |
| Client id  | 32 bits, unsigned      | chosen by the server for each player at registration, counting from 0                 | 4294967295        |
| Seat       | a place in a side list | the order of a side's player ids in `Roster`                                          | an empty place    |
| Net id     | 32 bits, unsigned      | chosen by the server for what it creates; worked out from a name for what a map holds | 0                 |
| Node       | 8 bits, unsigned       | the owning client's client id plus 1, or 0 for an object no client owns               | 0                 |
| Region id  | 32 bits, unsigned      | chosen by the server for each region, and carried by `RegionAdded`                    | (none stated)     |
| Name hash  | 32 bits, unsigned      | worked out from the name of a spell, an effect, a particle or a bone                  | 0                 |

A field's own definition gives its exact type. Where a field carries one of
these, it carries it whole, at the width above.

<!-- binding: identifiers -->
<!-- by range -->*Ranges add to this: [1.0](bindings/1-0-0-126/objects.md).*

## How they relate

A player is known by a player id. Registration pairs each player id with a
client id: a server answers a client's `Register` with one `Registered` for
every seat, and the answer carrying the client's own player id gives the
client its own client id. Every later message that names a player by client
id is read through that pairing.

`Roster` lists each side's player ids in order, and a player's seat is their
place in that list. A client finds a seat's client id through its player id.
`SeatName`, `SeatChampion` and the `VersionSync` seats name a player by player
id; `SeatLoadProgress` names both.

A champion carries the client id of the player it belongs to, or 4294967295
for a bot's champion. The `CreateChampion` carrying a client's own client id
makes that champion the client's own.

A server MUST give each player a client id from 0 to 252. A client given a
greater one fails as it connects.

## Net ids

A net id names one object in a client's world: a unit, a missile, a particle,
a marker, a prop. The header of every game message carries one, and fields
naming a unit, an owner or a target carry one too.

- A server MUST NOT give an object net id 0, which names nothing.
- A server SHOULD NOT give an object a net id whose top byte is 0xFF, which the
  identifiers of what a map holds use, nor one whose top byte is any client's
  client id plus 1, which a client uses for objects of its own making.
- A server MUST NOT give a new object a net id it has given another object in
  the same match, except in a soft reconnect (see below). A client that still
  holds the earlier object creates the new one but keeps the net id on the old
  one, so messages naming it reach the old object, and removing either leaves
  the id naming neither. A server cannot always tell when a client has removed
  an object, since some removals follow a client's own pace.

`CreateTurret` gives a net id to a turret the map already holds, matched by
name. Given to a turret that already has one, it gives it a second, and both
name it.

## Nodes

A create message carries a node beside the object's net id. A server sends the
owning client's client id plus 1, or 0 for an object no client owns. Nothing a
player sees depends on it.

## What a client holds

A client holds an object from the message that creates it until the message,
or the end of its life, that removes it. Creating messages are listed in
[Units](units.md), and several can arrive inside the `EnterSight` that brings
a unit into view. What a map holds, its buildings and the points minions come
from, a client holds from the moment it loads the map.

Leaving a client's sight removes nothing: `LeaveSight`, `LeaveLocalSight` and
`LeaveTeamSight` hide an object, and it is held as before.

<!-- binding: lifetimes -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/objects.md).*

Regions are named by region ids, apart from net ids.

<!-- binding: regions -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/objects.md).*

### A soft reconnect

`SoftReconnect` rebuilds a client's world without a new connection, in two
halves. The first marks every unit and every object kept until a checkpoint,
inhibitors aside. A create message for a marked net id replaces the marked
object rather than keeping the id on it. The second removes every object still
marked. In between, a server sends again each object the client is to keep.
Each range names the stage that marks; any other value removes.

<!-- binding: soft-reconnect -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/objects.md), [4.20](bindings/4-20-0-315/objects.md).*

## Messages about objects a client does not hold

A message whose header names a net id the client does not hold, or whose body
names one it needs, does nothing, and the client answers nothing for it.
Creating messages are the exception, and so are these:

- `SpawnPet` takes the net id in its header for the new pet, but does nothing
  where the owner its body names is not held; `CreateFollower` does nothing
  where the unit it follows is not held.
- A `WaypointGroup` or `WaypointGroupAtSpeed` path for a unit not yet held is
  applied once an object takes that net id, and its `WaypointAck` is sent as
  usual. A server does not rely on this, and sends the creating message first.
- A `Replication` batch skips the units a client does not hold, and goes
  unanswered (see [Ordering](ordering.md)).
- `SoundPlayed` naming an owner the client does not hold plays the sound with
  no place.
- `EnterSight` and `EnterLocalSight` act on the messages they carry whether or
  not the client holds the unit they name.

Nothing is held back for later, those paths aside: a message that arrives
before the message creating what it names is lost. [Ordering](ordering.md)
says what that requires of a server.

<!-- binding: before-selection -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/objects.md).*

## A message naming its sender

A message that names a player names them with a value the sender chose. A
receiving client acts on that value, associating the message with a player and
applying whatever the viewer has set for them, whatever connection the message
arrived on.

A server MUST therefore set any field naming the sender from the connection the
message arrived on. A server MUST NOT copy the value the message carried. Relaying
what arrived lets one player send messages that every other client attributes
to another.

## Net ids of what a map holds

Some objects are on the field before any message puts them there, and no
message ever does: the buildings a side defends and the shops beside them. A
receiving end knows them from the map it loaded, and every message naming one
names it by an identifier worked out from that object's name in the map.

The identifier is the CRC-32 of the name, with the top byte set:

```text
identifier = crc32(name) | 0xFF000000
```

The name is taken byte for byte with its case kept, so `OrderShop01` and
`orderShop01` are two names and give two identifiers. The CRC-32 is the common
one: the polynomial 0x04C11DB7 read reflected, starting from 0xFFFFFFFF and
finishing with every bit inverted, so the nine bytes `123456789` give
0xCBF43926.

The identifiers with that top byte are these:

| Name                            | Identifier   | `map`         |
| ------------------------------- | ------------ | ------------- |
| `Barracks_T1_C1`                | `0xFF4A20F1` | 1, 11, 12     |
| `Barracks_T1_L1`                | `0xFFD23C3E` | 1, 10, 11     |
| `Barracks_T1_R1`                | `0xFF9303E1` | 1, 10, 11     |
| `Barracks_T2_C1`                | `0xFFFF8F1F` | 1, 11, 12     |
| `Barracks_T2_L1`                | `0xFF6793D0` | 1, 10, 11     |
| `Barracks_T2_R1`                | `0xFF26AC0F` | 1, 10, 11     |
| `__P_Order_Spawn_Barracks__C01` | `0xFFB77171` | 1             |
| `ChaosShop01`                   | `0xFF3A98D9` | 12            |
| `chaosShop01`                   | `0xFFA6170E` | 1, 8, 10, 11  |
| `HQ_T1`                         | `0xFFF97DB5` | 1, 10, 11, 12 |
| `HQ_T2`                         | `0xFFF02C0F` | 1, 10, 11, 12 |
| `OrderShop01`                   | `0xFF8C490C` | 12            |
| `orderShop01`                   | `0xFF10C6DB` | 1, 8, 11      |

The `Barracks` names above belong to inhibitors, whatever the name says. The
minions a side sends out come from spawn points of their own, which are among
the objects a map holds. On map 1 one of them is
`__P_Order_Spawn_Barracks__C01`.

<!-- binding: barracks -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/objects.md).*

No message creates these objects, so nothing a server sends could give a client
a different identifier for one. A server MUST name each by the identifier its
name gives.

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

Every step is worked in 32 bits. Only `A` to `Z` change; every other byte is
taken as it is, so `SummonerFlash` and `summonerflash` give one number. A
particle's name includes its extension, so the number comes from
`global_ss_flash.troy` and not from `global_ss_flash`. The nine bytes
`123456789` give 0x0678AEE9.

| Name                      | Number       |
| ------------------------- | ------------ |
| `SummonerFlash`           | `0x06496EA8` |
| `RegenerationPotion`      | `0x0E75DC7E` |
| `EzrealMysticShotMissile` | `0x05FE9CE5` |
| `global_ss_flash.troy`    | `0x0058E369` |
| `L_HAND`                  | `0x0725E844` |

A server MUST name each such thing by the number its name gives.
