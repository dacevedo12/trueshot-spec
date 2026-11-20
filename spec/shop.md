# The shop

What fills the shop, what a client asks for, and what a server answers.

## What fills it

A client's catalogue of items is its own: no message sends or changes it. A
client sets its shop up for its own champion, and filters nothing out of the
shop by the champion's level.

<!-- holds from 0.8.13.26 up to 1.0.0.141 -->

> **In 0.8.13.26–1.0.0.140**
>
> `Loadout` does nothing to the shop: a client fills its shop from its own data,
> and takes the items it suggests from its champion's own data.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> An item's own data says whether it can be bought.

<!-- holds from 1.0.0.58 up to 1.0.0.141 -->

> **In 1.0.0.58–1.0.0.140**
>
> The data of the map `VersionSync` names lists the items that cannot be bought,
> and can list the only items the shop holds. No mode or variant has a list of
> its own, and nothing a server sends changes what can be bought.

<!-- holds from 1.0.0.58 up to 1.0.0.61 -->

> **In 1.0.0.58–1.0.0.60**
>
> A client uses the map's list of the items the shop holds only where a setting
> of its own turns it on.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> Suggested items depend on neither the map nor the mode.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> Suggested items also depend on the mode `VersionSync` names, but not on the
> map.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client sets its shop up from its own champion's `CreateChampion` (the one
> carrying its own client id) and then that champion's `Loadout`. Until the
> `Loadout` arrives, its shop opens empty and too big for the screen: no items,
> no suggested items, no builds. Given its own champion's `Loadout`, it shows
> every item and the items it suggests for the champion.
>
> What a match sells is settled by the client's own data for the map, the mode
> and the variants named in `VersionSync`. The map's data lists items that
> cannot be bought, with further lists for the mode and each variant; a mode
> with no list of its own removes nothing. Suggested items also depend on the
> map and the mode. Of what a server sends, only these change what can be
> bought:
>
> - `VersionSync`'s disabled items; a zero place disables nothing.
> - `ItemSubstitution`: the shop shows a substitute for an item, at the
>   substitute's price, until `SubstitutionCleared`.

## Buying and selling

A client asks to buy with `BuyItem`, to sell or throw away an item with
`RemoveItem`, and to swap two slots of its inventory with `SwapItems`. Closing
the shop sends nothing.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> Opening the shop sends nothing either.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> Opening the shop sends `TutorialShopOpened`, in any match, except while the
> shop is locked.

<!-- holds from 1.0.0.126 up to 1.0.0.141 -->

> **In 1.0.0.126–1.0.0.140**
>
> Opening the shop while the match is paused sends nothing.

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> Opening the shop sends nothing, except in the tutorial, where it sends
> `TutorialShopOpened`.

A client asks to buy only where the item is one the match sells.

<!-- holds from 0.8.13.26 up to 3.10.0.237 -->

> **In 0.8.13.26–3.9**
>
> A client asks for an item not built from others only where its price is
> within the champion's gold and, unless the item can be used in the shop,
> where a slot is free or holds the same item below its stack limit.

<!-- holds from 0.8.13.26 up to 1.0.0.61 -->

> **In 0.8.13.26–1.0.0.60**
>
> A client asks for an item a player holds only one of even where the player
> holds it already, and an item that can be used in the shop needs a slot as
> any other does.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> For an item built from others, a client asks only where a slot is free or
> holds one of its parts, and where the champion's gold covers what remains
> after the parts it holds.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> A client asks only while the shop is not locked, with the champion dead or
> near a shop of its side.

<!-- holds from 1.0.0.126 up to 4.1.0.171 -->

> **In 1.0.0.126–3.15**
>
> A client never asks for an item a player holds only one of and holds already.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client asks only with the shop open.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client asks for an item not built from others only where its price is
> within the champion's gold and a slot is free or holds the same item below its
> stack limit; an item that can be used in the shop needs neither while the
> champion is alive. For an item built from others, a client asks only where the
> champion holds a free slot or a part of it, everything the item requires, and
> gold for what remains.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client asks to buy only where shopping is allowed (`ShopEnabled`), with the
> champion near its side's shop, dead, or allowed to shop from anywhere. It
> never asks for an item not built from others that a player holds only one of
> and holds already. For an item built from others, it asks only where the
> champion holds a free slot or a part of it, everything the item requires, and
> gold for what remains.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> For an item not built from others, a client asks only where:
>
> - `VersionSync` does not disable it, judging a substituted item by its
>   substitute;
> - the champion's gold covers its price, and, under a substitution, the
>   substitute's price as well;
> - a slot is free, or holds the same item below its stack limit; an item that
>   can be used in the shop needs neither while the champion is alive.
>
> In the tutorial, it does not ask while its shop is locked
> ([The interface](interface.md)).

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> For an item not built from others, a client asks only where:
>
> - `VersionSync` does not disable it;
> - the champion's gold covers its price, and, under a substitution, the
>   substitute's price as well;
> - a slot is free, or holds the same item below its stack limit.
>
> Where an item's group sets a delay between purchases, a client asks for no
> item of that group until the delay has passed since it last asked for one,
> answered or not. In the tutorial, it does not ask while its shop is locked
> ([The interface](interface.md)).

A client never places an item itself: an item enters its inventory only as a
server answers with `ItemAdded`, leaves it with `RemoveItemAnswer`, and moves
with `SwapItemsAnswer`. A server can also set a slot (`InventorySlot`), set the
whole inventory (`InventorySnapshot`), change an item's charges
(`ItemCharges`), or report an item used (`ItemUsed`).

<!-- holds from 0.8.13.26 up to 4.20.0.315 -->

> **In 0.8.13.26–4.19**
>
> `ItemAdded` places the item and removes nothing: a server sends a
> `RemoveItemAnswer` for each part an item built from others takes up. Gold
> falls only as replication states the champion's gold, and a purchase a server
> never answers places nothing and spends nothing.

<!-- holds from 1.0.0.58 up to 4.20.0.315 -->

> **In 1.0.0.58–4.19**
>
> A purchase a server never answers still plays the sound of buying.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A purchase a server never answers still lists the item among recent
> purchases.

## Undo

Where `VersionSync`'s features set shopUndo, the shop has an undo button, which
is enabled while `ShopUndoCount` gives the champion undos to spend. Pressing it
sends `ShopUndo`, whatever the count.

## Closing

`CloseShop` closes the shop where it is open. Input locks close it too (see
[The interface](interface.md#input)).

<!-- messages -->
