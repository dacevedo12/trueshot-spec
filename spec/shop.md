# The shop

How the shop works between a server and a 4.17 client: what fills it, what a
client asks for, and what a server answers. Layouts live in `schema/`.

## What fills it

A client's catalogue of items is its own: no message sends or changes it. What
a server decides is which of those items a match lets a player buy, and whether
the shop has a player to show them to.

A client sets its shop up for its own champion, from the champion's
`CreateChampion` (the one whose seat is the client's own, and not a bot's) and
then that champion's `Loadout`. Until the `Loadout` arrives, the shop opens
empty and too big for the screen: no items, no suggested items, no builds. A
server sends each champion's `Loadout` during the spawn run, and a 4.17.0.267
client given its own champion's `Loadout` shows every item and the items it
suggests for the champion.

What a match sells is settled by the client's own data for the map, the mode
and the variants named in `VersionSync`. The map's data lists items that cannot
be bought, with further lists for the mode and each variant, which is how a map
or a mode keeps its own items. Suggested items are kept per champion, and
chosen by map and mode. Of what a server sends, only these change what can be
bought:

- `VersionSync`'s disabled items: none can be bought; a zero place disables
  nothing.
- `ItemSubstitution`: the shop shows a substitute for an item, at the
  substitute's price, until `SubstitutionCleared`.

A client filters nothing out of the shop by the champion's level, and a mode
with no list of its own removes nothing.

## Buying and selling

A client asks to buy with `BuyItem`, to sell or throw away an item with
`RemoveItem`, and to swap two slots of its inventory with `SwapItems`. Opening
and closing the shop sends nothing, except in the tutorial, where opening it
sends `TutorialShopOpened`.

A client asks to buy only where shopping is allowed (`ShopEnabled`), with the
champion near its side's shop, dead, or allowed to shop from anywhere; where the
item is one it sells, not barred, and priced, after any substitution, within
the champion's gold; where the item is not one a player holds only one of and
holds already; and where a slot is free, unless the item can be used in the
shop. For an item built from others, it asks only where the champion holds a
free slot or a part of it, everything the item requires, and gold for what
remains.

A client never places an item itself. It shows a purchase only when a server
answers with `ItemAdded`, a sale or loss with `RemoveItemAnswer`, and a swap
with `SwapItemsAnswer`. A server can also set a slot (`InventorySlot`), set the
whole inventory (`InventorySnapshot`), change an item's charges
(`ItemCharges`), or report an item used (`ItemUsed`).

## Undo

Where `VersionSync`'s features set shopUndo, the shop has an undo button, which
is enabled while `ShopUndoCount` gives the champion undos to spend. Pressing it
sends `ShopUndo`, whatever the count.

## Closing and locking

`CloseShop` closes the shop where it is open. Locking the shop with `InputLock`
or `InputLockToggled` closes it and turns off its key.
