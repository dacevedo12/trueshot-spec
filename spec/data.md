# The client's data

What a server needs that no message carries, and takes from the files a client
installs: the buildings and spawn points of a map, the ground units walk on,
and the figures of champions, items and spells. A client reads the same files,
so a server that takes its figures from elsewhere states a match the client
draws differently.

Nothing here is part of the protocol, and none of it is copied into this
repository. This chapter says which files hold what a server needs and what
in them it reads; their contents are the client's own.

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
  states through [replication](replication.md) and the casting record.

<!-- binding: files -->
