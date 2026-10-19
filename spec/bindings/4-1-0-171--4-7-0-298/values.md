# Sides and slots

<!-- place: book-size -->

A champion's own book ends at slot 60. A client ignores an `Autocast` or a `SpellToggled` naming a
slot above 60, and applies a `SpellInSlot` or a `SpellCostChanged` naming one
while reporting it as an error. A server MUST NOT name a champion book slot above 60.

<!-- place: inventory-size -->

A champion's inventory ends at slot 38. A client ignores a `RemoveItemAnswer`,
`InventorySlot`, `ItemAdded`, `ItemUsed` or `ItemCharges` naming a slot above 38. A server MUST NOT name an inventory slot above 38.
