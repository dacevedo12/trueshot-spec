# Vision

What a client can see, and how a server tells it. A client draws what a server
says it sees and nothing else: the fog of war a client draws is only a picture,
and what lies inside it is whatever the server has brought into view.

## Bringing a unit into view

A server brings a unit into what a client's side can see with `EnterSight`. It
states everything a client needs to draw the unit at once: its looks, its items,
its shields, where it stands or which path it walks, and, in what follows, its
health and resource. It can also carry whole messages of the game family, such
as the `CreateTurret` or `CreateNeutral` that makes the unit, which a client
reads as though each had arrived on its own. Where a layout marks the last
parts of the body as present while bytes remain, a body ends early once the
unit has nothing more to say, and those parts are left out from the end.

A client does not draw a champion that no `EnterSight` has placed: given only
its `CreateChampion`, a client shows the champion's portrait and spells and
nothing on the field. One `EnterSight` after the `CreateChampion` draws it, with
its name and health bar over it.

`EnterLocalSight` brings a unit into what one client alone can see, and states
its health and resource. `EnterTeamSight` brings an object into the view of a
whole side.

## Losing sight

`LeaveSight`, `LeaveLocalSight` and `LeaveTeamSight` take a unit out of the
matching view. Leaving a view hides a unit and does not remove it, so a client
still holds it (see [Objects and identifiers](objects.md)). `LeaveLocalSight` naming a client's own champion changes
nothing it shows. Particles come into and leave a side's view with
`ParticleEnterTeamSight` and `ParticleLeaveTeamSight`.

## Regions

A region is a patch of ground with sight of its own, which can reveal hidden
units within it. A server places one with `RegionAdded`, moves it with
`RegionMoved` and takes it away with `RegionRemoved`; [Objects and
identifiers](objects.md) says how regions are named and when one ends. A region granting sight
has a client clear its map's cover over it.

<!-- binding: regions -->

## Drawing the fog

`FogSet` and `FogToggled` concern how a client draws its fog of war.

<!-- binding: fog -->

## Who is told what

A client acts on a message about whichever unit it names, its own champion or
another, so what a client knows is whatever a server sends it. A server
decides, message by message, which clients to tell.

Some messages exist in more than one form, each for its own audience, laid
out alike:

| For every client    | For the clients that can see the unit | For the unit's own client  |
| ------------------- | ------------------------------------- | -------------------------- |
| `UnitDied`          | `UnitDiedOnMap`                       |                            |
| `InventorySnapshot` | `InventorySnapshotOnMap`              |                            |
| `FloatingText`      | `FloatingTextOnMap`                   |                            |
| `SpellSlotChanged`  |                                       | `SpellSlotChangedForOwner` |

Which of these forms a range has is in its definitions.

<!-- binding: audiences -->

Messages about a champion's own state, its gold, its inventory, its spells'
levels, cooldowns and charges, and whether it can shop, are applied to the
champion they name on any client that receives them, but a client shows most
of them only for its own champion:

- `GoldGained` shows floating gold only for the client's own champion.
- `ItemAdded` and `InventorySlot` announce a purchase only for the client's own
  champion; an ally's purchase is called out where the message asks for it.
- `ShopEnabled` changes the shop only for the client's own champion.
- `LevelUp` shows its effect over any unit the client can see.

A server SHOULD send `SpellCooldown`, `SpellCharges` and `GoldGained` about a
champion only to the client whose champion it is.

A client also acts on what it is told about a unit it holds but cannot see:

- a particle on a hidden unit is created but not drawn until the unit comes
  into view, unless the particle is bound to a target the client can see;
- floating text over a hidden unit is dropped;
- an animation plays on a hidden unit, which comes into view part way through
  it.

A client holds whatever it is sent, shown or not. A server SHOULD NOT send a
client what its side cannot see, beyond what keeps its world consistent.

## Messages

<!-- messages:begin -->

| Message                                                                    | Sent by | 4.17          | 4.20          | What it does                                                                            |
| -------------------------------------------------------------------------- | ------- | ------------- | ------------- | --------------------------------------------------------------------------------------- |
| [`EnterLocalSight`](../schema/messages/EnterLocalSight.json)               | server  | 174 on events | 174 on events | What a server sends when a unit comes into what one client can see                      |
| [`EnterSight`](../schema/messages/EnterSight.json)                         | server  | 186 on events | 186 on events | What a server sends when a unit comes into what a side can see                          |
| [`EnterTeamSight`](../schema/messages/EnterTeamSight.json)                 | server  | 224 on events | 224 on events | What a server sends when a unit comes into the view of a whole side                     |
| [`FogSet`](../schema/messages/FogSet.json)                                 | server  | 171 on events | 171 on events | Turn the drawing of the fog of war on or off                                            |
| [`FogToggled`](../schema/messages/FogToggled.json)                         | server  | 126 on events | 126 on events | Turn the drawing of the fog of war off where it is on, or on where it is off            |
| [`LeaveLocalSight`](../schema/messages/LeaveLocalSight.json)               | server  | 53 on events  | 53 on events  | What a server sends when a unit passes out of what one client can see                   |
| [`LeaveSight`](../schema/messages/LeaveSight.json)                         | server  | 81 on events  | 81 on events  | What a server sends when a unit passes out of what a side can see                       |
| [`LeaveTeamSight`](../schema/messages/LeaveTeamSight.json)                 | server  | 225 on events | 225 on events | What a server sends when a unit passes out of the view of a whole side                  |
| [`ParticleEnterTeamSight`](../schema/messages/ParticleEnterTeamSight.json) | server  | 226 on events | 226 on events | What a server sends as a particle comes into what one side can see                      |
| [`ParticleLeaveTeamSight`](../schema/messages/ParticleLeaveTeamSight.json) | server  | 227 on events | 227 on events | What a server sends as a particle passes out of what one side can see                   |
| [`RegionAdded`](../schema/messages/RegionAdded.json)                       | server  | 35 on events  | 35 on events  | Place a region on the ground: a patch that grants sight, blocks the way, or grows cover |
| [`RegionMoved`](../schema/messages/RegionMoved.json)                       | server  | 36 on events  | 36 on events  | Move a region of sight, keeping all else about it                                       |
| [`RegionRemoved`](../schema/messages/RegionRemoved.json)                   | server  | 51 on events  | 51 on events  | Take away a region RegionAdded placed                                                   |

<!-- messages:end -->
