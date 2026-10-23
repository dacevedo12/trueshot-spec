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

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client makes only circular regions, and its regions see over walls or not as
> the region says.

## Drawing the fog

`FogSet` and `FogToggled` concern how a client draws its fog of war.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client draws its fog of war, or the map with no darkening, as `FogSet` and
> `FogToggled` say. Neither changes what the client can see.

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

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> `UnitDiedOnMap`, `InventorySnapshotOnMap`, `FloatingTextOnMap` and
> `SpellSlotChangedForOwner` do not exist, so a server sends both audiences of
> `UnitDied`, `InventorySnapshot`, `FloatingText` and `SpellSlotChanged` under
> the one command each.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A server sends the narrower audience as a message of its own, and sends the
> wider form only where every client is to know.

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

<!-- messages -->
