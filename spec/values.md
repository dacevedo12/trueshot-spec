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

| Slot        | Holds                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| 0 to 3      | the champion's spells; 3 is its ultimate                                   |
| 4 on        | the spell of the item in the inventory slot four below, for each such slot |
| after those | spells a server places for the match's own purposes                        |

Its summoner book holds the two summoner spells, in slots 0 and 1.

A message that names a spell slot either carries a flag, set for the summoner
book and clear for the champion's own, or names the champion's own book only.
A cast's description (`SpellCast`) carries no flag: the spell's own data says
whether it is a summoner spell.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A cast's slot also takes 64, for a basic attack. A client reports any other
> slot beyond the book as an error, and carries on.

<!-- holds from 0.9.25.24 up to 1.0.0.127 -->

> **In 0.9.25.24–1.0.0.126**
>
> A cast's slot also takes 64 to 70, for a basic attack.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> Of those, 64 is the champion's basic attack, 65 to 67 its other basic
> attacks, 68 its critical attack, 69 a miss and 70 a dodge.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A cast's slot also takes 64 to 69, for a basic attack: 64 is the champion's
> basic attack, 65 to 67 its other basic attacks, 68 its critical attack and
> 69 a miss.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A cast's slot also takes values beyond the books: 64 to 72 for a basic
> attack, 73 to 81 for a critical one, and 255 for a cast from no slot.

A server MUST NOT name a champion book slot beyond the book's last slot.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A champion's own book ends at slot 22. A client reports an `Autocast` naming
> a slot above 22 as an error, and keeps it all the same. A server MUST NOT
> name a champion book slot above 22.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A champion's own book ends at slot 44. A client reports an `Autocast` naming
> a slot above 44 as an error, and keeps it all the same. A server MUST NOT
> name a champion book slot above 44.

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> A champion's own book ends at slot 48. A client reports an `Autocast` naming
> a slot above 48 as an error, and keeps it all the same. A server MUST NOT
> name a champion book slot above 48.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A champion's own book ends at slot 51. A client applies an `Autocast` or a
> `SpellInSlot` naming a slot above 51 while reporting it as an error. A server
> MUST NOT name a champion book slot above 51.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A champion's own book ends at slot 51. A client ignores an `Autocast` naming
> a slot above 51. A server MUST NOT name a champion book slot above 51.

<!-- holds from 4.1.0.171 up to 4.7.0.296 -->

> **In 4.1–4.6**
>
> A champion's own book ends at slot 60. A client ignores an `Autocast` or a
> `SpellToggled` naming a slot above 60, and applies a `SpellInSlot` or a
> `SpellCostChanged` naming one while reporting it as an error. A server MUST
> NOT name a champion book slot above 60.

<!-- holds from 4.7.0.296 up to 4.21.0.0 -->

> **In 4.7–4.20**
>
> A champion's own book runs on to slot 62: slot 61 is using an object on the
> field (see `UseObject`), and slot 62 the champion's passive. A server MUST NOT
> name a champion book slot above 62.

## Inventory slots

A champion's inventory holds the six items a player sees and uses in slots 0
to 5, and further slots after them up to its last.

An item is cast from the spell slot four above its inventory slot, and moving
an item moves its spell with it. A server MUST NOT name an inventory slot
beyond the inventory's last slot.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A champion's inventory ends at slot 14, and holds neither a trinket nor an
> item for recalling. A client takes an answer about an item naming a slot
> above 14 all the same, reporting it as an error and writing past the end of
> the inventory. A server MUST NOT name an inventory slot above 14.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A champion's inventory ends at slot 36, and a player sees and uses only slots
> 0 to 5. A client takes a `RemoveItemAnswer` naming a slot above 36 all the
> same, reporting it as an error and writing past the end of the inventory. A
> server MUST NOT name an inventory slot above 36.

<!-- holds from 1.0.0.96 up to 1.0.0.141 -->

> **In 1.0.0.96–1.0.0.140**
>
> A client asks to swap only slots 0 to 5 (`SwapItems`).

<!-- holds from 1.0.0.126 up to 1.0.0.141 -->

> **In 1.0.0.126–1.0.0.140**
>
> A champion's inventory ends at slot 37. A client ignores a
> `RemoveItemAnswer`, `InventorySlot`, `ItemAdded` or `ItemUsed` naming a slot
> above 37. A server MUST NOT name an inventory slot above 37.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Slot 6 holds the trinket, slot 7 the item recalling uses, and slots from 8 on
> items held for the match's own purposes, which nothing a player sees shows. A
> client asks to swap only slots 0 to 6 (`SwapItems`).

<!-- holds from 4.1.0.171 up to 4.7.0.296 -->

> **In 4.1–4.6**
>
> A champion's inventory ends at slot 38. A client ignores a
> `RemoveItemAnswer`, `InventorySlot`, `ItemAdded`, `ItemUsed` or `ItemCharges`
> naming a slot above 38. A server MUST NOT name an inventory slot above 38.

<!-- holds from 4.7.0.296 up to 4.21.0.0 -->

> **In 4.7–4.20**
>
> A champion's inventory ends at slot 39. A server MUST NOT name an inventory
> slot above 39.

## Effect slots

Adding an effect to a slot replaces whatever held it, and removing one empties
the slot whatever its name.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> Each unit has 32 slots for the effects it carries, 0 to 31. A client uses a
> slot above 31 all the same, past the end of the unit's slots. A server MUST
> NOT name an effect slot above 31.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> Each unit has 64 slots for the effects it carries, 0 to 63. A slot outside
> that range does nothing.
