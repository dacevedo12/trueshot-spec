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
> `EnterSight` states the unit's items.

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
> `EnterSight` and `EnterLocalSight` can carry whole messages of the game family,
> such as the `CreateTurret` or `CreateNeutral` that makes the unit, each taking
> effect as though it had arrived on its own.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> `EnterSight` states the unit's shields and looks and, for a champion or a
> minion, where it stands or which path it walks, and nothing of its health or
> resource. A client reads every part of the body whatever its length, so a
> server MUST NOT end one early.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> `EnterSight` states the unit's shields and looks and, for a champion or a
> minion, where it stands or which path it walks, and nothing of its health or
> resource. A client reads every part of the body whatever its length, so a
> server MUST NOT end one early. For a prop of the map or a building (a nexus,
> an inhibitor, a shop or a spawn point) it reads nothing after the messages
> carried.

<!-- holds from 4.1.0.171 up to 4.2.0.2718 -->

> **In 4.1**
>
> A client reads every part of an `EnterSight` body whatever its length, so a
> server MUST NOT end one early.

<!-- holds from 4.10.0.369 up to 4.20.0.315 -->

> **In 4.10–4.19**
>
> A client reads every part of an `EnterSight` body whatever its length, so a
> server MUST NOT end one early.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> `EnterSight` states the unit's shields and looks and, for a champion or a
> minion, where it stands or which path it walks, and nothing of its health or
> resource. For an inhibitor or a nexus a client reads nothing after the
> messages carried.

A client does not draw a champion that no `EnterSight` has placed. One `EnterSight` after the `CreateChampion` draws it, with
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
> `EnterLocalSight` states the unit's maximum health and its health, and nothing
> of its resource.

## Losing sight

`LeaveSight` and `LeaveTeamSight` take a unit out of the matching view, and
leave it held (see [Objects and identifiers](objects.md)). Particles come into
and leave a side's view with `ParticleEnterTeamSight` and
`ParticleLeaveTeamSight`.

<!-- holds from 0.8.13.26 up to 0.9.25.36 -->

> **In 0.8.13.26–0.9.25.35**
>
> `LeaveLocalSight` takes a unit out of what one client alone can see, and
> leaves it held.

<!-- holds from 1.0.0.58 up to 1.0.0.127 -->

> **In 1.0.0.58–1.0.0.126**
>
> `LeaveLocalSight` changes nothing a client shows, whichever unit it names.

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> `LeaveLocalSight` takes a unit out of what one client alone can see, and
> leaves it held.

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

## Who is told what

A client acts on a message about whichever unit it names, its own champion or
another, so what a client knows is whatever a server sends it.

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

Messages about a champion's own state, its inventory, its spells'
levels, cooldowns and charges, and whether it can shop, are applied to the
champion they name on any client that receives them, but a client shows some
of them only for its own champion:

- `ShopEnabled` changes the shop only for the client's own champion.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> `GoldGained` shows floating gold only for the client's own champion.

<!-- holds from 0.9.25.24 up to 1.0.0.58 -->

> **In 0.9.25.24–1.0.0.57**
>
> `ItemAdded` announces no purchase, a client's own or another's.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> `LevelUp` shows its effect over any champion the client can see, and does
> nothing for another unit.
>
> `GoldGained` naming the client's own champion, with an amount above 0.5 and a
> source the client holds, shows the gold over the source. Any other `GoldGained`
> naming a unit the client holds shows over it the gold gained, or lost where
> the amount is below 0, and nothing for 0.

<!-- holds from 1.0.0.58 up to 1.0.0.61 -->

> **In 1.0.0.58–1.0.0.60**
>
> `LevelUp` shows its effect over any champion the client can see, and does
> nothing for another unit.
>
> `GoldGained` naming the client's own champion, with an amount above 0.5 and a
> source the client holds, shows the gold over the source. Any other `GoldGained`
> naming a champion, a minion or a turret the client holds shows over it the
> gold gained, or lost where the amount is below 0, and nothing for 0; naming
> any other unit, it has no defined effect. `ItemAdded` announces no purchase, a
> client's own or another's.

<!-- holds from 1.0.0.96 up to 4.21.0.0 -->

> **In 1.0.0.96–4.20**
>
> `ItemAdded` and `InventorySlot` announce a purchase only for the client's own
> champion; an ally's purchase is called out where the message asks for it.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> `GoldGained` naming the client's own champion, with an amount above 0.5 and a
> source the client holds, shows the gold over the source. Any other `GoldGained`
> naming a unit the client holds shows over it the gold gained, or lost where
> the amount is below 0, and nothing for 0.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> `LevelUp` shows its effect over any champion the client can see, and does
> nothing for another unit.
>
> `GoldGained` naming the client's own champion, with an amount above 0.5 and a
> source the client holds, shows the gold over the source. Any other `GoldGained`
> naming a unit the client holds shows over it the gold gained, or lost where
> the amount is below 0, and nothing for 0.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> `GoldGained` naming the client's own champion, with an amount above 0.5 and a
> source the client holds other than its own player, shows the gold over the
> source. Any other `GoldGained` naming a champion the client holds shows over
> it the gold gained, or lost where the amount is below 0, and nothing for 0.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> `GoldGained` naming the client's own champion, with an amount above 0.5 and a
> source the client holds, shows the gold over the source, or over the champion
> where the source cannot show text. Any other `GoldGained` naming a unit the
> client holds shows over that unit the gold gained, or lost where the amount
> is below 0, and nothing for 0.

<!-- holds from 3.11.0.306 up to 4.21.0.0 -->

> **In 3.11–4.20**
>
> `GoldGained` shows floating gold only for the client's own champion.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> `GoldGained` naming the client's own champion, with an amount above 0.5 and a
> source the client holds, shows the gold over the source, or over the champion
> where the source cannot show text.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> `LevelUp` shows its effect over any unit the client can see.

A server SHOULD send `SpellCooldown`, `SpellCharges` and `GoldGained` about a
champion only to the client whose champion it is.

A client also acts on what it is told about a unit it holds but cannot see:

- a particle on a hidden unit is created but not drawn until the unit comes
  into view, unless the particle is bound to a target the client can see;
- floating text over a hidden unit is dropped;
- an animation plays on a hidden unit, which comes into view part way through
  it.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> While `LeaveLocalSight` has its own champion out of its local sight, until an
> `EnterLocalSight` brings it back, a client drops `UnitText` naming that
> champion and shows no healing numbers over it. A client playing back a stream
> ignores `LeaveLocalSight`.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client drops `FloatingText` and `UnitText` over a unit not in its local
> sight, even one it can see: one no `EnterLocalSight` has brought in, or one
> `LeaveLocalSight` has taken out. It drops the healing numbers it would show for
> its own champion while that champion is out of local sight.

A server SHOULD NOT send a
client what its side cannot see, beyond what keeps its world consistent.

<!-- messages -->
