# Sides and slots

Values many systems share: which side something is on, and how a unit's spell,
item and effect slots are numbered.

## Sides

A side is 100 or 200, for the two sides that play, or 300 for what belongs to
neither, such as a monster of no side. Where a field takes 0, it names no
side, and its definition says what that means: for `HealthBar` and
`ScreenTint`, every side; for `FadeMinions`, both.

A few fields carry a side in another form, and their definitions say so:

- `CreateChampion` carries one bit: set for side 100, clear for 200.
- `ParticleEnterTeamSight` and `ParticleLeaveTeamSight` carry an index: 0 for
  side 100, 1 for 200 and 2 for 300.
- `SpawnUnit` carries the side value in the low 9 bits of its flags.

`Roster` lists the players of each side, and a player's place in that list is
their seat (see [Objects and identifiers](objects.md)).

## Spell slots

A champion has two books of spells. Its own book holds slots 0 to 62:

| Slot     | Holds                                                                       |
| -------- | --------------------------------------------------------------------------- |
| 0 to 3   | the champion's spells; 3 is its ultimate                                    |
| 4 to 43  | the spell of the item in inventory slot 0 to 39: slot 4 is inventory slot 0 |
| 44 to 60 | spells a server places for the match's own purposes                         |
| 61       | using an object on the field (see `UseObject`)                              |
| 62       | the champion's passive                                                      |

Of the item slots, 4 to 10 are the items a player casts, inventory slots 0 to
6, and 11, inventory slot 7, is what recalling uses.

Its summoner book holds the two summoner spells, in slots 0 and 1.

A message says which book it means:

- `CastSpell`, `CancelTargeting`, `SpellSlotChanged`, `SpellCooldown`,
  `SpellCharge`, `SpellCharges` and `StopAttack` each carry a flag that is set
  for the summoner book and clear for the champion's own.
- `SpellInSlot`, `SpellLevel` and `SpellToggled` name the champion's own book
  only.
- A cast's description (`SpellCast`) carries no flag: the spell's own data says
  whether it is a summoner spell. Its slot also takes values beyond the books:
  64 to 72 for a basic attack, 73 to 81 for a critical one, and 255 for a cast
  from no slot.

A server MUST NOT name a champion book slot above 62.

## Inventory slots

A champion's inventory holds slots 0 to 39:

| Slot    | Holds                                                                      |
| ------- | -------------------------------------------------------------------------- |
| 0 to 5  | the six items a player sees and uses                                       |
| 6       | the trinket                                                                |
| 7       | the item recalling uses                                                    |
| 8 to 39 | items held for the match's own purposes, which nothing a player sees shows |

An item is cast from the spell slot four above its inventory slot, and moving
an item moves its spell with it. A client asks to swap only slots 0 to 6
(`SwapItems`). A server MUST NOT name an inventory slot above 39.

## Effect slots

Each unit has 64 slots for the effects it carries, 0 to 63. Adding an effect
to a slot replaces whatever held it, and removing one empties the slot whatever
its name. A slot outside that range does nothing.
