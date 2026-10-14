# The shop

How the shop works: what fills it, what a client asks for, and what a server
answers. Layouts live in `schema/`.

Applies to 4.17 and 4.20 clients, as [Versions](versions.md) describes.

## What fills it

A client's catalogue of items is its own: no message sends or changes it. What
a server decides is which of those items a match lets a player buy, and whether
the shop has a player to show them to.

A client sets its shop up for its own champion, from the champion's
`CreateChampion` (the one carrying the client's own client id) and
then that champion's `Loadout`. Until the `Loadout` arrives, its shop opens
empty and too big for the screen: no items, no suggested items, no builds.
Given its own champion's `Loadout`, it shows every item and the items it
suggests for the champion. A server sends each champion's `Loadout` during
the spawn run.

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

## Messages

<!-- messages:begin -->

| Message                                                                    | Sent by | 4.17            | 4.20            | What it does                                                                                                                                                         |
| -------------------------------------------------------------------------- | ------- | --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`BuyItem`](../schema/messages/BuyItem.json)                               | client  | 130 on requests | 130 on requests | Buy an item from the shop                                                                                                                                            |
| [`CloseShop`](../schema/messages/CloseShop.json)                           | server  | 14 on events    | 14 on events    | Close a client's shop                                                                                                                                                |
| [`InventorySlot`](../schema/messages/InventorySlot.json)                   | server  | 83 on events    | 83 on events    | Set one slot of a unit's inventory                                                                                                                                   |
| [`InventorySnapshot`](../schema/messages/InventorySnapshot.json)           | server  | 268 on events   | 268 on events   | State a unit's whole inventory at once, with each slot's cooldown                                                                                                    |
| [`InventorySnapshotOnMap`](../schema/messages/InventorySnapshotOnMap.json) | server  | none            | 295 on events   | State a unit's whole inventory at once, with each slot's cooldown, to the clients that can see the unit                                                              |
| [`ItemAdded`](../schema/messages/ItemAdded.json)                           | server  | 111 on events   | 111 on events   | Set what sits in one of a unit's item slots                                                                                                                          |
| [`ItemCharges`](../schema/messages/ItemCharges.json)                       | server  | 253 on events   | 253 on events   | Set how many charges an item holds                                                                                                                                   |
| [`ItemSubstitution`](../schema/messages/ItemSubstitution.json)             | server  | 284 on events   | 284 on events   | Have one item stand in for another in a champion's inventory                                                                                                         |
| [`ItemUsed`](../schema/messages/ItemUsed.json)                             | server  | 159 on events   | 159 on events   | What a server sends after an item in a unit's inventory is used                                                                                                      |
| [`Loadout`](../schema/messages/Loadout.json)                               | server  | 42 on events    | 42 on events    | Lay out everything a champion brought to the match: the runes set before it began, its summoner slots, the choices made alongside them, and what its wards look like |
| [`RemoveItem`](../schema/messages/RemoveItem.json)                         | client  | 9 on requests   | 9 on requests   | Be rid of an item, either by selling it or by discarding it                                                                                                          |
| [`RemoveItemAnswer`](../schema/messages/RemoveItemAnswer.json)             | server  | 11 on events    | 11 on events    | Confirm an item left a slot                                                                                                                                          |
| [`ShopEnabled`](../schema/messages/ShopEnabled.json)                       | server  | 240 on events   | 240 on events   | Say whether a champion can use the shop                                                                                                                              |
| [`ShopUndo`](../schema/messages/ShopUndo.json)                             | client  | 266 on requests | 266 on requests | What a client sends as its player presses the shop's undo button                                                                                                     |
| [`ShopUndoCount`](../schema/messages/ShopUndoCount.json)                   | server  | 267 on events   | 267 on events   | Say how many purchases a champion can still undo                                                                                                                     |
| [`SubstitutionCleared`](../schema/messages/SubstitutionCleared.json)       | server  | 285 on events   | 285 on events   | Undo an ItemSubstitution, so the shop shows the item itself again                                                                                                    |
| [`SwapItems`](../schema/messages/SwapItems.json)                           | client  | 32 on requests  | 32 on requests  | Move an item from one slot to another                                                                                                                                |
| [`SwapItemsAnswer`](../schema/messages/SwapItemsAnswer.json)               | server  | 62 on events    | 62 on events    | Confirm an item moved between slots                                                                                                                                  |
| [`TutorialShopOpened`](../schema/messages/TutorialShopOpened.json)         | client  | 93 on requests  | 93 on requests  | What a client in the tutorial sends as its player opens the shop                                                                                                     |

<!-- messages:end -->
