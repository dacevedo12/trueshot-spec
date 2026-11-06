# Vision

What a client can see, and how a server tells it. A client draws what a server
says it sees and nothing else: the fog of war a client draws is only a picture,
and what lies inside it is whatever the server has brought into view.

## Bringing a unit into view

A server brings a unit into what a client's side can see with `EnterSight`.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> `EnterSight` states nothing but the unit it names, and only marks that unit as
> in view.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> `EnterSight` states where the unit stands or which path it walks, and nothing
> of its looks, shields, health or resource.

<!-- holds from 1.0.0.97 up to 4.21.0.0 -->

> **In 1.0.0.97–4.20**
>
> `EnterSight` also states the unit's items.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> `EnterSight` states the unit's shields and where it stands or which path it
> walks, and nothing of its health or resource. A client reads every part of the
> body whatever its length, so a server MUST NOT end one early. For a turret, an
> inhibitor, a nexus or a prop it reads no body at all.

<!-- holds from 1.0.0.138 up to 4.21.0.0 -->

> **In 1.0.0.138–4.20**
>
> `EnterSight` can also carry whole messages of the game family, such as the
> `CreateTurret` or `CreateNeutral` that makes the unit, each taking effect as
> though it had arrived on its own.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> `EnterSight` states everything a client needs to draw the unit at once: its
> looks, its shields, where it stands or which path it walks, and, in what
> follows, its health and resource. A body MAY end early where its layout marks
> the remaining parts as present only while bytes remain.

A client does not draw a champion that no `EnterSight` has placed: given only
its `CreateChampion`, a client shows the champion's portrait and spells and
nothing on the field. One `EnterSight` after the `CreateChampion` draws it, with
its name and health bar over it.

`EnterLocalSight` brings a unit into what one client alone can see.
`EnterTeamSight` brings an object into the view of a whole side.

<!-- holds from 0.8.13.26 up to 1.0.0.61 -->

> **In 0.8.13.26–1.0.0.60**
>
> `EnterLocalSight` states nothing of the unit.

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> `EnterLocalSight` states the unit's health.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> `EnterLocalSight` states the unit's maximum health beside its health, and
> nothing of its resource.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> `EnterLocalSight` states the unit's resource beside its health.

## Losing sight

`LeaveSight` and `LeaveTeamSight` take a unit out of the matching view, and
leave it held (see [Objects and identifiers](objects.md)). Particles come into
and leave a side's view with `ParticleEnterTeamSight` and
`ParticleLeaveTeamSight`.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> `LeaveLocalSight` takes a unit out of what one client alone can see, and
> leaves it held.

<!-- holds from 1.0.0.58 up to 1.0.0.127 -->

> **In 1.0.0.58–1.0.0.126**
>
> `LeaveLocalSight` changes nothing a client shows, whichever unit it names.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> `LeaveLocalSight` takes a unit out of what one client alone can see, and
> leaves it held. One naming a client's own champion changes nothing it shows.

## Regions

A region is a patch of ground with sight of its own, which can reveal hidden
units within it. A server places one with `RegionAdded` or fastens one to a
unit with `RegionAttached`, moves it with `RegionMoved` and takes it away with
`RegionRemoved`; [Objects and identifiers](objects.md) says how regions are
named and when one ends. A region granting sight has a client clear its map's
cover over it.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> A client makes only circular regions.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A region fastened to a unit with a radius of 3000 or less is blocked by walls,
> and any other sees over them; nothing in a region chooses this.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client's regions see over walls or not as the region says.

## Drawing the fog

`FogSet` and `FogToggled` change how a client draws its fog of war.

<!-- holds from 1.0.0.58 up to 4.20.0.315 -->

> **In 1.0.0.58–4.19**
>
> A client draws its fog of war, or the map with no darkening, as `FogSet` and
> `FogToggled` say. Neither changes what the client can see.

## Who is told what

A client acts on a message about whichever unit it names, its own champion or
another, so what a client knows is whatever a server sends it. A server
decides, message by message, which clients to tell.

<!-- holds from 0.8.13.26 up to 4.20.0.315 -->

> **In 0.8.13.26–4.19**
>
> `UnitDiedOnMap`, `InventorySnapshotOnMap`, `FloatingTextOnMap` and
> `SpellSlotChangedForOwner` do not exist, so a server sends both audiences of
> `UnitDied`, `InventorySnapshot`, `FloatingText` and `SpellSlotChanged` under
> the one command each.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> Some messages exist in more than one form, each for its own audience, laid
> out alike:
>
> | For every client    | For the clients that can see the unit | For the unit's own client  |
> | ------------------- | ------------------------------------- | -------------------------- |
> | `UnitDied`          | `UnitDiedOnMap`                       |                            |
> | `InventorySnapshot` | `InventorySnapshotOnMap`              |                            |
> | `FloatingText`      | `FloatingTextOnMap`                   |                            |
> | `SpellSlotChanged`  |                                       | `SpellSlotChangedForOwner` |
>
> A server sends the narrower audience as a message of its own, and sends the
> wider form only where every client is to know.

Messages about a champion's own state, its gold, its inventory, its spells'
levels, cooldowns and charges, and whether it can shop, are applied to the
champion they name on any client that receives them, but a client shows some
of them only for its own champion:

- `ShopEnabled` changes the shop only for the client's own champion.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> `GoldGained` shows floating gold only for the client's own champion.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> `GoldGained` naming the client's own champion, with an amount above 0 and a
> source the client holds, shows the gold over the source.

<!-- holds from 0.9.25.24 up to 1.0.0.61 -->

> **In 0.9.25.24–1.0.0.60**
>
> Any other `GoldGained` shows the gold gained or lost over the unit it names,
> whichever unit that is. `ItemAdded` announces no purchase, a client's own or
> another's.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> `LevelUp` shows its effect over any unit the client can see.

<!-- holds from 1.0.0.58 up to 1.0.0.61 -->

> **In 1.0.0.58–1.0.0.60**
>
> `LevelUp` shows its effect over any champion the client can see, and does
> nothing for another unit.

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> `ItemAdded` and `InventorySlot` announce a purchase only for the client's own
> champion; an ally's purchase is called out where the message asks for it.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> `LevelUp` shows its effect over any champion the client can see, and does
> nothing for another unit.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> `GoldGained` shows floating gold only for the client's own champion, and
> `LevelUp` shows its effect over any unit the client can see.

A server SHOULD send `SpellCooldown`, `SpellCharges` and `GoldGained` about a
champion only to the client whose champion it is.

A client also acts on what it is told about a unit it holds but cannot see:

- a particle on a hidden unit is created but not drawn until the unit comes
  into view, unless the particle is bound to a target the client can see;
- floating text over a hidden unit is dropped;
- an animation plays on a hidden unit, which comes into view part way through
  it.

A server SHOULD NOT send a
client what its side cannot see, beyond what keeps its world consistent.

<!-- messages -->
