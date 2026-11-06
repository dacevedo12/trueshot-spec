# The shop

What fills the shop, what a client asks for, and what a server answers.

## What fills it

A client's catalogue of items is its own: no message sends or changes it. A
client sets its shop up for its own champion, and what a match sells is
settled by the client's own data. A client filters nothing out of the shop by
the champion's level.

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
> Suggested items are kept per champion, whatever the map or the mode.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> Suggested items are kept per champion and chosen by the mode `VersionSync`
> names, whatever the map.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> What a server decides is which of the client's items a match lets a player
> buy, and whether the shop has a player to show them to.
>
> A client sets its shop up from its own champion's `CreateChampion` (the one
> carrying its own client id) and then that champion's `Loadout`. Until the
> `Loadout` arrives, its shop opens empty and too big for the screen: no items,
> no suggested items, no builds. Given its own champion's `Loadout`, it shows
> every item and the items it suggests for the champion. A server sends each
> champion's `Loadout` during the spawn run.
>
> What a match sells is settled by the client's own data for the map, the mode
> and the variants named in `VersionSync`. The map's data lists items that
> cannot be bought, with further lists for the mode and each variant; a mode
> with no list of its own removes nothing. Suggested items are kept per champion, and chosen by map and
> mode. Of what a server sends, only these change what can be bought:
>
> - `VersionSync`'s disabled items: none can be bought; a zero place disables
>   nothing.
> - `ItemSubstitution`: the shop shows a substitute for an item, at the
>   substitute's price, until `SubstitutionCleared`.

## Buying and selling

A client asks to buy with `BuyItem`, to sell or throw away an item with
`RemoveItem`, and to swap two slots of its inventory with `SwapItems`. Closing
the shop sends nothing.

<!-- holds from 0.8.13.26 up to 1.0.0.70 -->

> **In 0.8.13.26–1.0.0.69**
>
> A client never asks to swap two slots: it has no `SwapItems`.

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

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Opening the shop sends nothing, except in the tutorial, where it sends
> `TutorialShopOpened`.

A client asks to buy only where the item is one the match sells and priced
within the champion's gold.

<!-- holds from 0.8.13.26 up to 1.0.0.127 -->

> **In 0.8.13.26–1.0.0.126**
>
> A client asks for an item not built from others only where a slot is free or
> holds the same item below its stack limit.

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

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> A client asks only while the shop is not locked, with the champion dead or
> near a shop of its side.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> A client never asks for an item a player holds only one of and holds already.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client asks only with the shop open.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client asks to buy only where shopping is allowed (`ShopEnabled`), with the
> champion near its side's shop, dead, or allowed to shop from anywhere; where
> the item's price, after any substitution, is within the champion's gold; and
> where a slot is free, unless the item can be used in the shop. For an item
> built from others, it asks only where the champion holds a free slot or a part
> of it, everything the item requires, and gold for what remains.

A client never places an item itself. It shows a purchase only when a server
answers with `ItemAdded`, a sale or loss with `RemoveItemAnswer`, and a swap
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

## Closing and locking

`CloseShop` closes the shop where it is open. A message that locks the shop
alone, `InputLock` or `InputLockToggled`, closes it and turns off its key.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A message that locks other input along with the shop stops the shop opening,
> but leaves an open shop open and its key on.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Any message that locks the shop closes it and turns off its key, whatever
> else it locks.

<!-- messages -->
