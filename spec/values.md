# Sides and slots

Values many systems share: which side something is on, and how a unit's spell,
item and effect slots are numbered.

## Sides

A side is 100 or 200, for the two sides that play, or 300 for what belongs to
neither, such as a monster of no side. Where a field takes 0, it names no
side; its note says what that means. A few fields carry a side in another
form, and their notes say which.

`Roster` lists the players of each side, and a player's place in that list is
their seat (see [Objects and identifiers](objects.md)).

## Spell slots

A champion has two books of spells. Its own book holds these slots:

| Slot     | Holds                                                  |
| -------- | ------------------------------------------------------ |
| 0 to 3   | the champion's spells; 3 is its ultimate               |
| 4 to 43  | the spell of the item in the inventory slot four below |
| 44 to 60 | spells a server places for the match's own purposes    |

Its summoner book holds the two summoner spells, in slots 0 and 1.

A message that names a spell slot either carries a flag, set for the summoner
book and clear for the champion's own, or names the champion's own book only.
A cast's description (`SpellCast`) carries no flag: the spell's own data says
whether it is a summoner spell. Its slot also takes values beyond the books:
64 to 72 for a basic attack, 73 to 81 for a critical one, and 255 for a cast
from no slot.

A server MUST NOT name a champion book slot beyond the book's last slot.

<!-- holds from 4.7.0.296 up to 4.21.0.0 -->

> **In 4.7–4.20**
>
> A champion's own book runs on to slot 62: slot 61 is using an object on the
> field (see `UseObject`), and slot 62 the champion's passive. A server MUST NOT
> name a champion book slot above 62.

<!-- holds from 4.1.0.171 up to 4.7.0.296 -->

> **In 4.1–4.6**
>
> A champion's own book ends at slot 60. A client ignores an `Autocast` or a `SpellToggled` naming a
> slot above 60, and applies a `SpellInSlot` or a `SpellCostChanged` naming one
> while reporting it as an error. A server MUST NOT name a champion book slot above 60.

## Inventory slots

A champion's inventory holds these slots:

| Slot   | Holds                                                                      |
| ------ | -------------------------------------------------------------------------- |
| 0 to 5 | the six items a player sees and uses                                       |
| 6      | the trinket                                                                |
| 7      | the item recalling uses                                                    |
| 8 on   | items held for the match's own purposes, which nothing a player sees shows |

An item is cast from the spell slot four above its inventory slot, and moving
an item moves its spell with it. A client asks to swap only slots 0 to 6
(`SwapItems`). A server MUST NOT name an inventory slot beyond the
inventory's last slot.

<!-- holds from 4.7.0.296 up to 4.21.0.0 -->

> **In 4.7–4.20**
>
> A champion's inventory ends at slot 39. A server MUST NOT name an inventory
> slot above 39.

<!-- holds from 4.1.0.171 up to 4.7.0.296 -->

> **In 4.1–4.6**
>
> A champion's inventory ends at slot 38. A client ignores a `RemoveItemAnswer`,
> `InventorySlot`, `ItemAdded`, `ItemUsed` or `ItemCharges` naming a slot above 38. A server MUST NOT name an inventory slot above 38.

## Effect slots

Each unit has 64 slots for the effects it carries, 0 to 63. Adding an effect
to a slot replaces whatever held it, and removing one empties the slot whatever
its name. A slot outside that range does nothing.
