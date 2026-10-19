# Vision

<!-- place: regions -->

A client makes only circular regions, and its regions see over walls or not as
the region says.

<!-- place: fog -->

A client draws its fog of war, or the map with no darkening, as `FogSet` and
`FogToggled` say. Neither changes what the client can see.

<!-- place: audiences -->

`UnitDiedOnMap`, `InventorySnapshotOnMap`, `FloatingTextOnMap` and
`SpellSlotChangedForOwner` do not exist, so a server sends both audiences of
`UnitDied` and `InventorySnapshot` under the one command.
