# Replication

<!-- place: layout -->

The groups follow in the order 0 to 4, and nothing gives a group's length:
each value is four bytes, so a group takes four bytes for its set of values and
four for each bit that set has set. A client takes a batch on channels 2, 3
and 4 alike, however it was sent.

Each value is a 32-bit float or a 32-bit unsigned integer, as its row in the
tables below says, and travels as it stands, with no other encoding. A value
that says yes or no is an integer, 1 for yes and 0 for no.

A client passes over a set bit its table has no row for, and a group its table
has none of, by their four bytes each, without taking anything from them. A
server MUST name in a batch only champions, minions, turrets, buildings and
props: a client treats a unit of any other kind as an error.

<!-- place: tables -->

Each row also gives the type a value is written in.

## A champion

| Group | Bits     | Value                                                                                                  | Type  |
| ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
| 0     | 0        | Experience                                                                                             | float |
| 0     | 1        | Gold in hand                                                                                           | float |
| 0     | 2 to 3   | Which slots can be cast from: the champion's own, then the second set                                  | u32   |
| 0     | 4 to 7   | What the spell in slots 0 to 3 costs                                                                   | float |
| 0     | 8 to 15  | What the spell in slots 42 to 49 costs                                                                 | float |
| 0     | 16 to 17 | What the spell in slots 0 and 1 of the second set costs                                                | float |
| 1     | 0        | What the champion is doing, as a set of bits                                                           | u32   |
| 1     | 1 to 3   | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
| 1     | 4        | Which sides can aim at it, as a set of bits                                                            | u32   |
| 1     | 5        | Whether it is proof against strikes                                                                    | u32   |
| 1     | 6        | Damage it deals by striking                                                                            | float |
| 1     | 7        | Damage its spells deal before modifiers                                                                | float |
| 1     | 8        | How often it turns a blow aside                                                                        | float |
| 1     | 9        | How often it strikes critically                                                                        | float |
| 1     | 10       | Armour                                                                                                 | float |
| 1     | 11       | Spell resistance                                                                                       | float |
| 1     | 12 to 13 | How fast health and resource return                                                                    | float |
| 1     | 14       | How far it strikes from                                                                                | float |
| 1     | 15 to 17 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
| 1     | 18 to 19 | Flat and percent reduction of the spell damage it takes                                                | float |
| 1     | 20       | A multiplier on how fast it strikes                                                                    | float |
| 1     | 21       | A flat addition to how far it casts                                                                    | float |
| 1     | 22       | A modifier on its cooldowns                                                                            | float |
| 1     | 23 to 24 | How much armour it cuts through, flat then as a percent                                                | float |
| 1     | 25 to 26 | How much spell resistance it cuts through, flat then as a percent                                      | float |
| 1     | 27       | Life steal                                                                                             | float |
| 1     | 28       | Spell vamp                                                                                             | float |
| 2     | 0 to 1   | Whether it is proof against strikes, then against spells, as group 1 bits 5 and 1                      | u32   |
| 3     | 0 to 1   | Health and resource as they stand                                                                      | float |
| 3     | 2 to 3   | Health and resource at their greatest                                                                  | float |
| 3     | 4 to 5   | A flat and a percent addition to how far it sees                                                       | float |
| 3     | 6        | How fast it moves                                                                                      | float |
| 3     | 7        | A value whose meaning is not recorded                                                                  | float |
| 3     | 8        | Level                                                                                                  | u32   |
| 3     | 9        | Kills taken from no side                                                                               | u32   |

Bit n of either set of slots that can be cast from stands for slot n. What the
second set and slots 42 to 49 hold is not recorded, and a server writes zero
in their costs. Which bit of what a champion is doing means what is not
recorded either. A client sets the sides that can aim at a unit to 33554432
where any can and 25165824 where none can.

## A turret

| Group | Bits     | Value                                                                                                  | Type  |
| ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
| 1     | 0        | Damage it deals by striking                                                                            | float |
| 1     | 1 to 2   | Armour and spell resistance                                                                            | float |
| 1     | 3        | A multiplier on how fast it strikes                                                                    | float |
| 1     | 4 to 6   | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
| 1     | 7        | How fast health returns                                                                                | float |
| 1     | 8 to 9   | Health as it stands, then at its greatest                                                              | float |
| 1     | 10       | What the turret is doing, as a set of bits                                                             | u32   |
| 1     | 11 to 13 | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
| 1     | 14       | Which sides can aim at it, as a set of bits                                                            | u32   |
| 1     | 15       | Whether it is proof against strikes                                                                    | u32   |
| 3     | 0 to 1   | A flat and a percent addition to how far it sees                                                       | float |
| 3     | 2        | How fast it moves                                                                                      | float |
| 3     | 3        | A value whose meaning is not recorded                                                                  | float |

## A minion, and a unit belonging to no side

| Group | Bits     | Value                                                                                                  | Type  |
| ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
| 1     | 0 to 1   | Health and resource as they stand                                                                      | float |
| 1     | 2 to 3   | Health and resource at their greatest                                                                  | float |
| 1     | 4        | What the unit is doing, as a set of bits                                                               | u32   |
| 1     | 5 to 7   | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
| 1     | 8        | Which sides can aim at it, as a set of bits                                                            | u32   |
| 1     | 9        | Whether it is proof against strikes                                                                    | u32   |
| 1     | 10       | Damage it deals by striking                                                                            | float |
| 1     | 11 to 12 | Armour and spell resistance                                                                            | float |
| 1     | 13       | A multiplier on how fast it strikes                                                                    | float |
| 1     | 14 to 16 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
| 1     | 17 to 18 | How fast health and resource return                                                                    | float |
| 1     | 19 to 20 | Flat and percent reduction of the spell damage it takes                                                | float |
| 3     | 0 to 1   | A flat and a percent addition to how far it sees                                                       | float |
| 3     | 2        | How fast it moves                                                                                      | float |
| 3     | 3        | A value whose meaning is not recorded                                                                  | float |

## A building

Inhibitors, nexuses and the buildings minions come from share one table. It
has no value for health at its greatest.

| Group | Bits   | Value                                                | Type  |
| ----- | ------ | ---------------------------------------------------- | ----- |
| 1     | 0      | Health as it stands                                  | float |
| 1     | 1 to 2 | Whether it is proof against all harm, and targetable | u32   |
| 1     | 3      | Which sides can aim at it, as a set of bits          | u32   |

## A prop

| Group | Bits   | Value                                                | Type  |
| ----- | ------ | ---------------------------------------------------- | ----- |
| 1     | 0      | Health as it stands                                  | float |
| 1     | 1      | Health as it stands, again                           | float |
| 1     | 2 to 3 | Whether it is proof against all harm, and targetable | u32   |
| 1     | 4      | Which sides can aim at it, as a set of bits          | u32   |
| 3     | 0 to 1 | A flat and a percent addition to how far it sees     | float |
| 3     | 2      | How fast it moves                                    | float |
| 3     | 3      | A value whose meaning is not recorded                | float |
