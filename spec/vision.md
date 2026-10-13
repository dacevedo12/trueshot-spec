# Vision

What a client can see, and how a server tells it. A client draws what a server
says it sees and nothing else: the fog of war a client draws is only a picture,
and what lies inside it is whatever the server has brought into view.
Applies to 4.20 clients, as [Versions](versions.md) describes.

## Bringing a unit into view

A server brings a unit into what a client's side can see with `EnterSight`. It
states everything a client needs to draw the unit at once: its looks, its items,
its shields, where it stands or which path it walks, and, in what follows, its
health and resource. It can also carry whole messages of the game family, such
as the `CreateTurret` or `CreateNeutral` that makes the unit, which a client
reads as though each had arrived on its own. A 4.17 `EnterSight` ends its body
early where the unit has nothing more to say: the parts its layout marks as
present while bytes remain are left out from the end.

A client does not draw a champion that no `EnterSight` has placed: given only
its `CreateChampion`, a client shows the champion's portrait and spells and
nothing on the field. One `EnterSight` after the `CreateChampion` draws it, with
its name and health bar over it.

`EnterLocalSight` brings a unit into what one client alone can see, and states
its health and resource. `EnterTeamSight` brings an object into the view of a
whole side.

## Losing sight

`LeaveSight`, `LeaveLocalSight` and `LeaveTeamSight` take a unit out of the
matching view. `LeaveLocalSight` naming a client's own champion changes
nothing it shows. Particles come into and leave a side's view with
`ParticleEnterTeamSight` and `ParticleLeaveTeamSight`.

## Regions

A region is a patch of ground with sight of its own, which can reveal hidden
units within it. A server places one with `RegionAdded`, moves it with
`RegionMoved` and takes it away with `RegionRemoved`. A region granting sight
has a client clear its map's cover over it. A 4.17 client makes only circular
regions, and its regions see over walls or not as the region says.

## Drawing the fog

A 4.17 client draws its fog of war, or the map with no darkening, as
`FogSet` and `FogToggled` say. Neither changes what the client can see.

## Messages

<!-- messages:begin -->

| Message                                                      | Sent by | 4.20          | What it does                                                                            |
| ------------------------------------------------------------ | ------- | ------------- | --------------------------------------------------------------------------------------- |
| [`EnterLocalSight`](../schema/messages/EnterLocalSight.json) | server  | 174 on events | What a server sends when a unit comes into what one client can see                      |
| [`EnterSight`](../schema/messages/EnterSight.json)           | server  | 186 on events | What a server sends when a unit comes into what a side can see                          |
| [`EnterTeamSight`](../schema/messages/EnterTeamSight.json)   | server  | 224 on events | What a server sends when a unit comes into the view of a whole side                     |
| [`LeaveLocalSight`](../schema/messages/LeaveLocalSight.json) | server  | 53 on events  | What a server sends when a unit passes out of what one client can see                   |
| [`LeaveSight`](../schema/messages/LeaveSight.json)           | server  | 81 on events  | What a server sends when a unit passes out of what a side can see                       |
| [`LeaveTeamSight`](../schema/messages/LeaveTeamSight.json)   | server  | 225 on events | What a server sends when a unit passes out of the view of a whole side                  |
| [`RegionAdded`](../schema/messages/RegionAdded.json)         | server  | 35 on events  | Place a region on the ground: a patch that grants sight, blocks the way, or grows cover |
| [`RegionRemoved`](../schema/messages/RegionRemoved.json)     | server  | 51 on events  | Take away a region RegionAdded placed                                                   |

<!-- messages:end -->
