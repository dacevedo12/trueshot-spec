# Objects and identifiers

<!-- place: lifetimes -->

How each kind leaves a client's world:

| Kind                 | Removed                                                                                                                                                                               | Its death                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Champion             | by `ChampionRemoved`, at once                                                                                                                                                         | kills it; it is held, and comes back                                    |
| Minion, monster, pet | by the client, once it has been dead for its death time, 4 seconds unless its character says otherwise; a new `SpawnPet` for an owner removes that owner's pet before it              | starts that wait; a death naming no killer does nothing                 |
| Turret               | by the client, 1.2 seconds after its death, or after the time its `SpawnTurret` gives; a lane turret is held where `VersionSync`'s features keep destroyed turrets (`turretsPersist`) | kills it                                                                |
| Inhibitor, nexus     | never                                                                                                                                                                                 | `BuildingDied` plays its death; it is held, and an inhibitor comes back |
| Missile              | by `DestroyMissile`, by its flight ending, or once its caster is removed                                                                                                              |                                                                         |
| Particle             | by `KillParticle`, naming it in its body, or once its effect ends                                                                                                                     |                                                                         |
| Follower             | once the unit it follows is removed                                                                                                                                                   |                                                                         |
| Marker               | only by a soft reconnect                                                                                                                                                              |                                                                         |
| Region               | by `RegionRemoved`, once its lifetime runs out (a lifetime of 0 never does), or once the unit it follows is removed                                                                   |                                                                         |

<!-- place: regions -->

A client fails on a `RegionMoved` naming a region it does not hold, one whose
lifetime has run out included, and a server MUST NOT send one. `RegionRemoved`
for a region a client does not hold does nothing.

<!-- place: soft-reconnect -->

The stage of `SoftReconnect` that marks is 0.

<!-- place: before-selection -->

A client drops game messages until it sends `CharacterSelected`, apart from the
few [Joining a match](../../joining.md) lists.

<!-- place: barracks -->

A client puts a minion on the field for a `SpawnFromBarracks` naming a spawn
point, and creates nothing for one naming an inhibitor such as
`Barracks_T1_C1`.
