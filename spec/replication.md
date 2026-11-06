# Replication

With `Replication` a server states what has changed about the units a client
can see: for each unit, the groups of values it carries and which values of
each follow. What the values are follows from the unit.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> The groups follow in the order 0 to 4, and nothing gives a group's length:
> each value is four bytes, so a group takes four bytes for its set of values and
> four for each bit that set has set.
>
> Each value is a 32-bit float or a 32-bit unsigned integer, as its row in the
> tables below says, and travels as it stands.
>
> A client passes over a set bit its table has no row for, and a group its table
> has none of, by their four bytes each, without taking anything from them. It
> passes over the values of a unit whose kind has no table the same way, and
> still answers the batch.

<!-- holds from 0.9.25.24 up to 1.0.0.127 -->

> **In 0.9.25.24–1.0.0.126**
>
> A value that says yes or no is an integer, 1 for yes and 0 for no. A client
> takes a batch on channels 2, 3 and 4 alike.

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> The groups follow in the order 0, 1, 2, 3, 5 and then 4: group 4 comes last,
> each behind the length of its run. A sending end MUST write each group's length
> as the number of bytes its run takes.
>
> Each value takes one of two shapes, and the table row naming it says which.
> Nothing on the wire carries a table, a field name, a width or a shape, so an
> end that does not already hold the table cannot read a run.
>
> A value that counts is a thirty two bit unsigned integer, and a value with a
> sign travels as the same thirty two bits. It takes seven bits from each byte,
> lowest seven first, and the top bit of a byte is set while another byte
> follows. Five bytes therefore carry anything it holds.
>
> A value that measures takes one of three forms: a single byte of 255 meaning
> zero; a byte of 254 followed by four bytes; or four bytes on their own. The
> four bytes are the measure itself, a thirty two bit float, lowest byte first.
> A sending end MUST write the byte of 254 before a measure whose lowest byte is
> 254 or 255, and MUST NOT write it before any other. A measure written plain
> therefore never begins with either, so its first byte says which form it
> takes.

## What settles a reading

A run is a sequence of values with nothing between them, in the order the set
bits name them, lowest first.

The bit that names a value means different things for different units.
Champions, turrets, minions and units belonging to no side, and buildings each
answer to a table of their own, so the same bit in the same group is one value
on one unit and another on the next. A sending end MUST write the table the
unit it names answers to.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A prop answers to no table, and a client takes nothing a batch carries for
> one.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> Props answer to a table of their own as well.

Which table a unit answers to follows from the message that put it on the
field (see [Units](units.md)). A building, which no message creates, answers to
the building table.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> The building table is the same on every map.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A building answers to the building table of the map loaded.

## Which batches a client takes

A client answers a batch with `TransientAck` where it holds every unit the
batch names, whether or not it took the values. [Ordering](ordering.md) says
which batches a client takes, and what that requires of a server.

## Reading the tables

Each row gives the group and bits that name a value and what the value is.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> Each row also gives the type a value is written in.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> ## A champion
>
> | Group | Bits     | Value                                                                                             | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------- | ----- |
> | 0     | 0        | Experience                                                                                        | float |
> | 0     | 1        | Gold in hand                                                                                      | float |
> | 0     | 2 to 3   | Which slots can be cast from: the champion's own, then the second set                             | u32   |
> | 0     | 4 to 7   | What the spell in slots 0 to 3 costs                                                              | float |
> | 0     | 8 to 11  | What the spell in slots 41 to 44 costs                                                            | float |
> | 0     | 12 to 13 | What the spell in slots 0 and 1 of the second set costs                                           | float |
> | 1     | 0 to 1   | Health and resource as they stand                                                                 | float |
> | 1     | 2 to 3   | Health and resource at their greatest                                                             | float |
> | 1     | 4        | What the champion is doing, as a set of bits                                                      | u32   |
> | 1     | 5 to 8   | Whether it is proof against spells, proof against all harm, targetable, and proof against strikes | u32   |
> | 2     | 0 to 1   | Whether it is proof against strikes, then against spells, as group 1 bits 8 and 5                 | u32   |
> | 2     | 2        | Damage it deals by striking                                                                       | float |
> | 2     | 3        | Damage its spells deal before modifiers                                                           | float |
> | 2     | 4        | How often it turns a blow aside                                                                   | float |
> | 2     | 5        | Its size                                                                                          | float |
> | 2     | 6        | How often it strikes critically                                                                   | float |
> | 2     | 7 to 8   | Armour and spell resistance                                                                       | float |
> | 2     | 9 to 10  | How fast health and resource return                                                               | float |
> | 2     | 11       | How fast it moves                                                                                 | float |
> | 2     | 12       | How far it strikes from                                                                           | float |
> | 2     | 13 to 14 | Flat and percent modifiers on the damage it strikes with                                          | float |
> | 2     | 15 to 16 | Flat and percent modifiers on its spells' damage                                                  | float |
> | 2     | 17 to 18 | Flat and percent reduction of the spell damage it takes                                           | float |
> | 2     | 19       | A multiplier on how fast it strikes                                                               | float |
> | 2     | 20       | A flat addition to how far it casts                                                               | float |
> | 2     | 21       | A modifier on its cooldowns                                                                       | float |
> | 3     | 0 to 1   | A percent and a flat addition to how far it sees                                                  | float |
> | 3     | 2        | Level                                                                                             | u32   |
>
> ## A turret
>
> | Group | Bits     | Value                                                    | Type  |
> | ----- | -------- | -------------------------------------------------------- | ----- |
> | 1     | 0        | Damage it deals by striking                              | float |
> | 1     | 1 to 2   | Armour and spell resistance                              | float |
> | 1     | 3        | How fast it moves                                        | float |
> | 1     | 4        | A multiplier on how fast it strikes                      | float |
> | 1     | 5        | Its size                                                 | float |
> | 1     | 6 to 7   | Flat and percent modifiers on the damage it strikes with | float |
> | 1     | 8 to 9   | Flat and percent modifiers on its spells' damage         | float |
> | 1     | 10 to 11 | How fast health and resource return                      | float |
> | 1     | 12 to 13 | Health as it stands, then at its greatest                | float |
> | 3     | 0 to 1   | A percent and a flat addition to how far it sees         | float |
>
> ## A minion, and a unit belonging to no side
>
> | Group | Bits     | Value                                                                                             | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------- | ----- |
> | 1     | 0 to 1   | Health as it stands, then at its greatest                                                         | float |
> | 1     | 2 to 3   | Whether it is proof against strikes, then against spells                                          | u32   |
> | 1     | 4        | What the unit is doing, as a set of bits                                                          | u32   |
> | 1     | 5 to 8   | Whether it is proof against spells, proof against all harm, targetable, and proof against strikes | u32   |
> | 1     | 9        | Damage it deals by striking                                                                       | float |
> | 1     | 10 to 11 | Armour and spell resistance                                                                       | float |
> | 1     | 12       | How fast it moves                                                                                 | float |
> | 1     | 13       | A multiplier on how fast it strikes                                                               | float |
> | 1     | 14       | Its size                                                                                          | float |
> | 1     | 15 to 16 | Flat and percent modifiers on the damage it strikes with                                          | float |
> | 1     | 17 to 18 | Flat and percent modifiers on its spells' damage                                                  | float |
> | 1     | 19 to 20 | How fast health and resource return                                                               | float |
> | 3     | 0 to 1   | A percent and a flat addition to how far it sees                                                  | float |
>
> ## A building
>
> Inhibitors, nexuses and the buildings minions come from share one table. It
> has no value for health at its greatest.
>
> | Group | Bits   | Value                                                | Type  |
> | ----- | ------ | ---------------------------------------------------- | ----- |
> | 1     | 0 to 1 | Whether it is proof against all harm, and targetable | u32   |
> | 1     | 2      | Health as it stands                                  | float |

<!-- holds from 1.0.0.58 up to 1.0.0.61 -->

> **In 1.0.0.58–1.0.0.60**
>
> ## A champion
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 0     | 0        | Experience                                                                                             | float |
> | 0     | 1        | Gold in hand                                                                                           | float |
> | 0     | 2        | Which slots can be cast from                                                                           | u32   |
> | 0     | 3 to 6   | What the spell in slots 0 to 3 costs                                                                   | float |
> | 0     | 7 to 14  | What the spell in slots 41 to 48 costs                                                                 | float |
> | 0     | 15 to 16 | What the spell in slots 0 and 1 of the second set costs                                                | float |
> | 1     | 0        | What the champion is doing, as a set of bits                                                           | u32   |
> | 1     | 1 to 3   | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
> | 1     | 4        | Whether it is proof against strikes                                                                    | u32   |
> | 1     | 5        | Damage it deals by striking                                                                            | float |
> | 1     | 6        | Damage its spells deal before modifiers                                                                | float |
> | 1     | 7        | How often it turns a blow aside                                                                        | float |
> | 1     | 8        | How often it strikes critically                                                                        | float |
> | 1     | 9        | Armour                                                                                                 | float |
> | 1     | 10       | Spell resistance                                                                                       | float |
> | 1     | 11 to 12 | How fast health and resource return                                                                    | float |
> | 1     | 13       | How far it strikes from                                                                                | float |
> | 1     | 14 to 16 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 17 to 18 | Flat and percent reduction of the spell damage it takes                                                | float |
> | 1     | 19       | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 20       | A flat addition to how far it casts                                                                    | float |
> | 1     | 21       | A modifier on its cooldowns                                                                            | float |
> | 2     | 0 to 1   | Whether it is proof against strikes, then against spells, as group 1 bits 4 and 1                      | u32   |
> | 3     | 0 to 1   | Health and resource as they stand                                                                      | float |
> | 3     | 2 to 3   | Health and resource at their greatest                                                                  | float |
> | 3     | 4 to 5   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 6        | How fast it moves                                                                                      | float |
> | 3     | 7        | A value whose meaning is not recorded                                                                  | float |
> | 3     | 8        | Level                                                                                                  | u32   |
>
> ## A turret
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 1     | 0        | Damage it deals by striking                                                                            | float |
> | 1     | 1 to 2   | Armour and spell resistance                                                                            | float |
> | 1     | 3        | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 4 to 6   | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 7        | How fast health returns                                                                                | float |
> | 1     | 8 to 9   | Health as it stands, then at its greatest                                                              | float |
> | 1     | 10       | What the turret is doing, as a set of bits                                                             | u32   |
> | 1     | 11 to 13 | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
> | 1     | 14       | Whether it is proof against strikes                                                                    | u32   |
> | 3     | 0 to 1   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 2        | How fast it moves                                                                                      | float |
> | 3     | 3        | A value whose meaning is not recorded                                                                  | float |
>
> ## A minion, and a unit belonging to no side
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 1     | 0 to 1   | Health and resource as they stand                                                                      | float |
> | 1     | 2 to 3   | Health and resource at their greatest                                                                  | float |
> | 1     | 4        | What the unit is doing, as a set of bits                                                               | u32   |
> | 1     | 5 to 7   | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
> | 1     | 8        | Whether it is proof against strikes                                                                    | u32   |
> | 1     | 9        | Damage it deals by striking                                                                            | float |
> | 1     | 10 to 11 | Armour and spell resistance                                                                            | float |
> | 1     | 12       | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 13 to 15 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 16 to 17 | How fast health and resource return                                                                    | float |
> | 3     | 0 to 1   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 2        | How fast it moves                                                                                      | float |
> | 3     | 3        | A value whose meaning is not recorded                                                                  | float |
>
> ## A building
>
> Inhibitors, nexuses and the buildings minions come from share one table. It
> has no value for health at its greatest.
>
> | Group | Bits   | Value                                                | Type  |
> | ----- | ------ | ---------------------------------------------------- | ----- |
> | 1     | 0      | Health as it stands                                  | float |
> | 1     | 1 to 2 | Whether it is proof against all harm, and targetable | u32   |

<!-- holds from 1.0.0.96 up to 1.0.0.127 -->

> **In 1.0.0.96–1.0.0.126**
>
> ## A champion
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 0     | 0        | Experience                                                                                             | float |
> | 0     | 1        | Gold in hand                                                                                           | float |
> | 0     | 2 to 3   | Which slots can be cast from: the champion's own, then the second set                                  | u32   |
> | 0     | 4 to 7   | What the spell in slots 0 to 3 costs                                                                   | float |
> | 0     | 8 to 15  | What the spell in each of eight further slots costs                                                    | float |
> | 0     | 16 to 17 | What the spell in slots 0 and 1 of the second set costs                                                | float |
> | 1     | 0        | What the champion is doing, as a set of bits                                                           | u32   |
> | 1     | 1 to 3   | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
> | 1     | 4        | Which sides can aim at it, as a set of bits                                                            | u32   |
> | 1     | 5        | Whether it is proof against strikes                                                                    | u32   |
> | 1     | 6        | Damage it deals by striking                                                                            | float |
> | 1     | 7        | Damage its spells deal before modifiers                                                                | float |
> | 1     | 8        | How often it turns a blow aside                                                                        | float |
> | 1     | 9        | How often it strikes critically                                                                        | float |
> | 1     | 10       | Armour                                                                                                 | float |
> | 1     | 11       | Spell resistance                                                                                       | float |
> | 1     | 12 to 13 | How fast health and resource return                                                                    | float |
> | 1     | 14       | How far it strikes from                                                                                | float |
> | 1     | 15 to 17 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 18 to 19 | Flat and percent reduction of the spell damage it takes                                                | float |
> | 1     | 20       | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 21       | A flat addition to how far it casts                                                                    | float |
> | 1     | 22       | A modifier on its cooldowns                                                                            | float |
> | 1     | 23 to 24 | How much armour it cuts through, flat then as a percent                                                | float |
> | 1     | 25 to 26 | How much spell resistance it cuts through, flat then as a percent                                      | float |
> | 1     | 27       | Life steal                                                                                             | float |
> | 1     | 28       | Spell vamp                                                                                             | float |
> | 2     | 0 to 1   | Whether it is proof against strikes, then against spells, as group 1 bits 5 and 1                      | u32   |
> | 3     | 0 to 1   | Health and resource as they stand                                                                      | float |
> | 3     | 2 to 3   | Health and resource at their greatest                                                                  | float |
> | 3     | 4 to 5   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 6        | How fast it moves                                                                                      | float |
> | 3     | 7        | A value whose meaning is not recorded                                                                  | float |
> | 3     | 8        | Level                                                                                                  | u32   |
>
> What the second set and the eight further slots hold is not recorded, and a
> server writes zero in their costs. Which bit of what a champion is doing means
> what is not recorded either. A client sets the sides that can aim at a unit to
> 33554432 where any can and 25165824 where none can.
>
> ## A turret
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 1     | 0        | Damage it deals by striking                                                                            | float |
> | 1     | 1 to 2   | Armour and spell resistance                                                                            | float |
> | 1     | 3        | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 4 to 6   | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 7        | How fast health returns                                                                                | float |
> | 1     | 8 to 9   | Health as it stands, then at its greatest                                                              | float |
> | 1     | 10       | What the turret is doing, as a set of bits                                                             | u32   |
> | 1     | 11 to 13 | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
> | 1     | 14       | Which sides can aim at it, as a set of bits                                                            | u32   |
> | 1     | 15       | Whether it is proof against strikes                                                                    | u32   |
> | 3     | 0 to 1   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 2        | How fast it moves                                                                                      | float |
> | 3     | 3        | A value whose meaning is not recorded                                                                  | float |
>
> ## A minion, and a unit belonging to no side
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 1     | 0 to 1   | Health and resource as they stand                                                                      | float |
> | 1     | 2 to 3   | Health and resource at their greatest                                                                  | float |
> | 1     | 4        | What the unit is doing, as a set of bits                                                               | u32   |
> | 1     | 5 to 7   | Whether it is proof against spells, proof against all harm, and targetable                             | u32   |
> | 1     | 8        | Which sides can aim at it, as a set of bits                                                            | u32   |
> | 1     | 9        | Whether it is proof against strikes                                                                    | u32   |
> | 1     | 10       | Damage it deals by striking                                                                            | float |
> | 1     | 11 to 12 | Armour and spell resistance                                                                            | float |
> | 1     | 13       | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 14 to 16 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 17 to 18 | How fast health and resource return                                                                    | float |
> | 1     | 19 to 20 | Flat and percent reduction of the spell damage it takes                                                | float |
> | 3     | 0 to 1   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 2        | How fast it moves                                                                                      | float |
> | 3     | 3        | A value whose meaning is not recorded                                                                  | float |
>
> ## A building
>
> Inhibitors, nexuses and the buildings minions come from share one table. It
> has no value for health at its greatest.
>
> | Group | Bits   | Value                                                | Type  |
> | ----- | ------ | ---------------------------------------------------- | ----- |
> | 1     | 0      | Health as it stands                                  | float |
> | 1     | 1 to 2 | Whether it is proof against all harm, and targetable | u32   |
> | 1     | 3      | Which sides can aim at it, as a set of bits          | u32   |

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> A champion's eight further slots are slots 41 to 48.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A champion's eight further slots are slots 42 to 49, and bit n of either set
> of slots that can be cast from stands for slot n. Its group 3 bit 9 holds the
> kills it has taken from no side, as a u32.
>
> ## A prop
>
> | Group | Bits   | Value                                                | Type  |
> | ----- | ------ | ---------------------------------------------------- | ----- |
> | 1     | 0      | Health as it stands                                  | float |
> | 1     | 1      | Health as it stands, again                           | float |
> | 1     | 2 to 3 | Whether it is proof against all harm, and targetable | u32   |
> | 1     | 4      | Which sides can aim at it, as a set of bits          | u32   |
> | 3     | 0 to 1 | A flat and a percent addition to how far it sees     | float |
> | 3     | 2      | How fast it moves                                    | float |
> | 3     | 3      | A value whose meaning is not recorded                | float |

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> ## A champion
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 0     | 0        | Gold in hand                                                                                           | float |
> | 0     | 1 to 2   | Which slots can be cast from: the champion's own, then the second set                                  | u32   |
> | 0     | 3 to 6   | What the spell in slots 0 to 3 costs                                                                   | float |
> | 0     | 7 to 14  | What the spell in slots 42 to 49 costs                                                                 | float |
> | 0     | 15 to 16 | What the spell in slots 0 and 1 of the second set costs                                                | float |
> | 1     | 0        | What the champion is doing, as a set of bits                                                           | u32   |
> | 1     | 1 to 3   | Whether it is proof against spells, proof against all harm, and proof against strikes                  | u32   |
> | 1     | 4        | Damage it deals by striking                                                                            | float |
> | 1     | 5        | Damage its spells deal before modifiers                                                                | float |
> | 1     | 6        | How often it turns a blow aside                                                                        | float |
> | 1     | 7        | How often it strikes critically                                                                        | float |
> | 1     | 8        | Armour                                                                                                 | float |
> | 1     | 9        | Spell resistance                                                                                       | float |
> | 1     | 10 to 11 | How fast health and resource return                                                                    | float |
> | 1     | 12       | How far it strikes from                                                                                | float |
> | 1     | 13 to 15 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 16 to 17 | Flat and percent reduction of the spell damage it takes                                                | float |
> | 1     | 18       | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 19       | A flat addition to how far it casts                                                                    | float |
> | 1     | 20       | A modifier on its cooldowns                                                                            | float |
> | 1     | 21 to 22 | How much armour it cuts through, flat then as a percent                                                | float |
> | 1     | 23 to 24 | How much spell resistance it cuts through, flat then as a percent                                      | float |
> | 1     | 25       | Life steal                                                                                             | float |
> | 1     | 26       | Spell vamp                                                                                             | float |
> | 3     | 0 to 1   | Health and resource as they stand                                                                      | float |
> | 3     | 2 to 3   | Health and resource at their greatest                                                                  | float |
> | 3     | 4        | Experience                                                                                             | float |
> | 3     | 5 to 6   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 7        | How fast it moves                                                                                      | float |
> | 3     | 8        | A value whose meaning is not recorded                                                                  | float |
> | 3     | 9        | Level                                                                                                  | u32   |
> | 3     | 10       | Kills taken from no side                                                                               | u32   |
>
> Bit n of either set of slots that can be cast from stands for slot n. What the
> second set and slots 42 to 49 hold is not recorded, and a server writes zero
> in their costs. Which bit of what a champion is doing means what is not
> recorded either.
>
> ## A turret
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 1     | 0 to 1   | Health as it stands, then at its greatest                                                              | float |
> | 1     | 2        | What the turret is doing, as a set of bits                                                             | u32   |
> | 1     | 3 to 5   | Whether it is proof against spells, proof against all harm, and proof against strikes                  | u32   |
> | 1     | 6        | Damage it deals by striking                                                                            | float |
> | 1     | 7 to 8   | Armour and spell resistance                                                                            | float |
> | 1     | 9        | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 10 to 12 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 13       | How fast health returns                                                                                | float |
> | 3     | 0 to 1   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 2        | How fast it moves                                                                                      | float |
> | 3     | 3        | A value whose meaning is not recorded                                                                  | float |
>
> ## A minion, and a unit belonging to no side
>
> | Group | Bits     | Value                                                                                                  | Type  |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----- |
> | 1     | 0 to 1   | Health and resource as they stand                                                                      | float |
> | 1     | 2 to 3   | Health and resource at their greatest                                                                  | float |
> | 1     | 4        | What the unit is doing, as a set of bits                                                               | u32   |
> | 1     | 5 to 7   | Whether it is proof against spells, proof against all harm, and proof against strikes                  | u32   |
> | 1     | 8        | Damage it deals by striking                                                                            | float |
> | 1     | 9 to 10  | Armour and spell resistance                                                                            | float |
> | 1     | 11       | A multiplier on how fast it strikes                                                                    | float |
> | 1     | 12 to 14 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | float |
> | 1     | 15 to 16 | How fast health and resource return                                                                    | float |
> | 1     | 17 to 18 | Flat and percent reduction of the spell damage it takes                                                | float |
> | 3     | 0 to 1   | A flat and a percent addition to how far it sees                                                       | float |
> | 3     | 2        | How fast it moves                                                                                      | float |
> | 3     | 3        | A value whose meaning is not recorded                                                                  | float |
>
> ## A building
>
> Inhibitors, nexuses and the buildings minions come from share one table. It
> has no value for health at its greatest.
>
> | Group | Bits | Value                                | Type  |
> | ----- | ---- | ------------------------------------ | ----- |
> | 1     | 0    | Health as it stands                  | float |
> | 1     | 1    | Whether it is proof against all harm | u32   |
>
> ## A prop
>
> | Group | Bits   | Value                                            | Type  |
> | ----- | ------ | ------------------------------------------------ | ----- |
> | 1     | 0      | Health as it stands                              | float |
> | 1     | 1      | Health as it stands, again                       | float |
> | 1     | 2      | Whether it is proof against all harm             | u32   |
> | 3     | 0 to 1 | A flat and a percent addition to how far it sees | float |
> | 3     | 2      | How fast it moves                                | float |
> | 3     | 3      | A value whose meaning is not recorded            | float |

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> Each row also gives the shape a sending end writes the value in.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> ## A champion
>
> | Group | Bits     | Value                                                                                    | Shape    |
> | ----- | -------- | ---------------------------------------------------------------------------------------- | -------- |
> | 0     | 0        | Gold in hand                                                                             | measured |
> | 0     | 1        | Gold earned in all                                                                       | measured |
> | 0     | 2 to 3   | Which of the champion's slots can be cast from, as a set of bits over two words          | counted  |
> | 0     | 4        | Points held for evolving a spell                                                         | counted  |
> | 0     | 5        | Which spells have evolved, as a set of bits                                              | counted  |
> | 0     | 6 to 25  | What the spell in one slot costs, slots 0 to 3 first                                     | measured |
> | 1     | 0 to 3   | What the champion is doing, and whether it is proof against spells, all harm and strikes | counted  |
> | 1     | 4        | Damage it deals by striking                                                              | measured |
> | 1     | 5        | Damage its spells deal before modifiers                                                  | measured |
> | 1     | 6        | How often it turns a blow aside                                                          | measured |
> | 1     | 7        | How often it strikes critically                                                          | measured |
> | 1     | 8        | Armour                                                                                   | measured |
> | 1     | 9        | Spell resistance                                                                         | measured |
> | 1     | 10 to 11 | How fast health and resource return                                                      | measured |
> | 1     | 12       | How far it strikes from                                                                  | measured |
> | 1     | 13 to 16 | Flat and percent modifiers on the damage it strikes with, then on its spells' damage     | measured |
> | 1     | 17 to 18 | Flat and percent reduction of the spell damage it takes                                  | measured |
> | 1     | 19       | A multiplier on how fast it strikes                                                      | measured |
> | 1     | 20       | A flat addition to how far from the champion an aimed spell's point is allowed to land   | measured |
> | 1     | 21       | A modifier on its cooldowns                                                              | measured |
> | 1     | 22       | When its passive's cooldown ends, as a moment on the match clock                         | measured |
> | 1     | 23       | How long its passive's cooldown lasts in all                                             | measured |
> | 1     | 24 to 25 | How much armour it cuts through, flat then as the share left standing                    | measured |
> | 1     | 26 to 27 | How much spell resistance it cuts through, flat then as the share left standing          | measured |
> | 1     | 28       | Life steal                                                                               | measured |
> | 1     | 29       | Spell vamp                                                                               | measured |
> | 1     | 30       | Crowd-control reduction                                                                  | measured |
> | 3     | 0 to 1   | Health and resource as they stand                                                        | measured |
> | 3     | 2 to 3   | Health and resource at their greatest                                                    | measured |
> | 3     | 4        | Experience                                                                               | measured |
> | 3     | 5 to 9   | Lifetime, and how far the champion sees                                                  | measured |
> | 3     | 10       | How fast it moves                                                                        | measured |
> | 3     | 11 to 12 | Its size, and how wide a path it needs                                                   | measured |
> | 3     | 13       | Level                                                                                    | counted  |
> | 3     | 14 to 16 | Kills taken from no side, and whether anything is allowed to aim at it                   | counted  |
>
> ## A turret
>
> | Group | Bits     | Value                                                                                  | Shape    |
> | ----- | -------- | -------------------------------------------------------------------------------------- | -------- |
> | 1     | 0 to 1   | Health as it stands, then at its greatest                                              | measured |
> | 1     | 2 to 5   | What the turret is doing, and whether it is proof against spells, all harm and strikes | counted  |
> | 1     | 6        | Damage it deals by striking                                                            | measured |
> | 1     | 7 to 8   | Armour and spell resistance                                                            | measured |
> | 1     | 9        | A multiplier on how fast it strikes                                                    | measured |
> | 1     | 10 to 13 | Flat and percent modifiers on the damage it strikes with, then on its spells' damage   | measured |
> | 1     | 14       | How fast health returns                                                                | measured |
> | 3     | 0 to 1   | How far it sees                                                                        | measured |
> | 3     | 2        | How fast it moves                                                                      | measured |
> | 3     | 3        | Its size                                                                               | measured |
> | 5     | 0 to 1   | Whether anything is allowed to aim at it, and which side is                            | counted  |
>
> ## A minion, and a unit belonging to no side
>
> Both answer to one table.
>
> | Group | Bits     | Value                                                                                | Shape    |
> | ----- | -------- | ------------------------------------------------------------------------------------ | -------- |
> | 1     | 0 to 1   | Health as it stands, then at its greatest                                            | measured |
> | 1     | 2 to 4   | How long it lives, as it stands and at its greatest, and the count of that           | measured |
> | 1     | 5 to 6   | Resource at its greatest, then as it stands                                          | measured |
> | 1     | 7 to 10  | What the unit is doing, and whether it is proof against spells, all harm and strikes | counted  |
> | 1     | 11       | Damage it deals by striking                                                          | measured |
> | 1     | 12 to 13 | Armour and spell resistance                                                          | measured |
> | 1     | 14       | A multiplier on how fast it strikes                                                  | measured |
> | 1     | 15 to 18 | Flat and percent modifiers on the damage it strikes with, then on its spells' damage | measured |
> | 1     | 19 to 20 | How fast health and resource return                                                  | measured |
> | 1     | 21       | A value whose meaning is not recorded                                                | measured |
> | 1     | 22 to 23 | Flat and percent reduction of the spell damage it takes                              | measured |
> | 3     | 0 to 1   | How far it sees                                                                      | measured |
> | 3     | 2        | How fast it moves                                                                    | measured |
> | 3     | 3        | Its size                                                                             | measured |
> | 3     | 4 to 5   | Whether anything is allowed to aim at it, and which side is                          | counted  |
>
> For some units the two resource values travel as group 3 bits 0 and 1
> instead: the rest of group 1 moves down two bits and the rest of group 3 up
> two. Which units do is not recorded.
>
> ## A building
>
> | Group | Bits   | Value                                                       | Shape    |
> | ----- | ------ | ----------------------------------------------------------- | -------- |
> | 1     | 0      | Health as it stands                                         | measured |
> | 1     | 1      | Whether the building is proof against harm                  | counted  |
> | 5     | 0 to 1 | Whether anything is allowed to aim at it, and which side is | counted  |
>
> ## A prop
>
> A server need not replicate a prop's values. Where it does, they follow the
> table below.
>
> | Group | Bits   | Value                                                       | Shape    |
> | ----- | ------ | ----------------------------------------------------------- | -------- |
> | 1     | 0 to 1 | Health as it stands, then at its greatest                   | measured |
> | 1     | 2      | Whether the prop is proof against harm                      | counted  |
> | 3     | 0 to 1 | How far it sees                                             | measured |
> | 3     | 2      | How fast it moves                                           | measured |
> | 3     | 3      | Its size                                                    | measured |
> | 3     | 4 to 5 | Whether anything is allowed to aim at it, and which side is | counted  |

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> ## A champion
>
> | Group | Bits     | Value                                                                                                  | Shape    |
> | ----- | -------- | ------------------------------------------------------------------------------------------------------ | -------- |
> | 0     | 0        | Gold in hand                                                                                           | measured |
> | 0     | 1        | Gold earned in all                                                                                     | measured |
> | 0     | 2 to 3   | Which of the champion's slots can be cast from, as a set of bits over two words                        | counted  |
> | 0     | 4 to 5   | Which summoner slots can be cast from, as a set of bits over two words                                 | counted  |
> | 0     | 6        | Points held for evolving a spell                                                                       | counted  |
> | 0     | 7        | Which spells have evolved, as a set of bits                                                            | counted  |
> | 0     | 8 to 27  | What the spell in one slot costs                                                                       | measured |
> | 1     | 0 to 4   | What the champion is doing, and four kinds of harm it is proof against                                 | counted  |
> | 1     | 5        | Damage it deals by striking                                                                            | measured |
> | 1     | 6        | Damage its spells deal before modifiers                                                                | measured |
> | 1     | 7        | How often it turns a blow aside                                                                        | measured |
> | 1     | 8        | How often it strikes critically                                                                        | measured |
> | 1     | 9        | Armour                                                                                                 | measured |
> | 1     | 10       | Spell resistance                                                                                       | measured |
> | 1     | 11 to 12 | How fast health and resource return                                                                    | measured |
> | 1     | 13       | How far it strikes from                                                                                | measured |
> | 1     | 14 to 16 | Flat and percent modifiers on the damage it strikes with, then the flat modifier on its spells' damage | measured |
> | 1     | 17 to 18 | Flat and percent reduction of the spell damage it takes                                                | measured |
> | 1     | 19       | A multiplier on how fast it strikes                                                                    | measured |
> | 1     | 20       | A flat addition to how far from the champion an aimed spell's point is allowed to land                 | measured |
> | 1     | 21       | A modifier on its cooldowns                                                                            | measured |
> | 1     | 22       | When its passive's cooldown ends, as a moment on the match clock                                       | measured |
> | 1     | 23       | How long its passive's cooldown lasts in all                                                           | measured |
> | 1     | 24 to 25 | How much armour it cuts through, flat then as the share left standing                                  | measured |
> | 1     | 26 to 27 | How much spell resistance it cuts through, flat then as the share left standing                        | measured |
> | 1     | 28       | Life steal                                                                                             | measured |
> | 1     | 29       | Spell vamp                                                                                             | measured |
> | 1     | 30       | Crowd-control reduction                                                                                | measured |
> | 2     | 0 to 1   | How much more armour and spell resistance it cuts through, as the share left standing                  | measured |
> | 3     | 0 to 1   | Health and resource as they stand                                                                      | measured |
> | 3     | 2 to 3   | Health and resource at their greatest                                                                  | measured |
> | 3     | 4        | Experience                                                                                             | measured |
> | 3     | 5 to 9   | Lifetime, and how far the champion sees                                                                | measured |
> | 3     | 10       | How fast it moves                                                                                      | measured |
> | 3     | 11 to 12 | Its size, and how wide a path it needs                                                                 | measured |
> | 3     | 13       | Level                                                                                                  | counted  |
> | 3     | 14 to 16 | Kills taken from no side, and whether anything is allowed to aim at it                                 | counted  |
>
> Bit 2 holds which of slots 0 to 3 can be cast from, one bit for each slot,
> set as a champion learns the spell in it, and bit 4 holds which summoner spells can be cast from, as a mask in which a server sets its bits 4 and 5, one for each summoner slot. Bits 3 and 5 of the group carry zero. [Sides and slots](values.md) numbers the slots.
>
> Bits 8 to 11 carry what the spells in slots 0 to 3 cost. A server sets bits 8
> to 27 together and writes zero in bits 12 to 27. It leaves bits 6 and 7, and
> group 1 bit 31, clear.
>
> A server writes 0x800007 in group 1 bit 0.
>
> ### What a client shows from this table
>
> A client shows, for a champion:
>
> - its health and resource bars, as they stand (group 3 bits 0 and 1) out of
>   their greatest (bits 2 and 3);
> - its level (group 3 bit 13), on the portrait and over the health bar,
>   together with the spell points that level brings;
> - its gold (group 0 bit 0);
> - in the panel under its portrait, ability power (group 1 bit 6), armour (bit
>   9), spell resistance (bit 10), movement speed (group 3 bit 10), and attack
>   speed as the champion's own base attack speed times group 1 bit 19;
> - in its panel of statistics, group 1 bit 21 as cooldown reduction, its size
>   as a percent whatever its sign; bits 28 and 29 as life steal and spell vamp,
>   and bit 30 as tenacity, each a fraction shown as a percent; and bits 24 and
>   26 as flat penetration of armour and of spell resistance.
>
> The attack damage the panel under the portrait shows is the client's own
> figure for the champion's level, with group 1 bit 14 added to it and drawn as
> a bonus.
>
> Until a champion's first batch arrives, the panel shows figures the client
> holds for that champion. Once one arrives, it shows the values batches carry,
> and armour, spell resistance, ability power and movement speed read 0 where no
> batch has carried them.
>
> Each percent penetration field carries the share of armour or spell resistance
> left standing, 1 where nothing is cut through. The panel shows what two of them
> cut through together, as 200 percent less both shares in percent: bit 25 of
> group 1 with bit 0 of group 2 for armour, and bit 27 of group 1 with bit 1 of
> group 2 for spell resistance.
>
> A spell's cooldown lasts its base length times one plus the modifier at bit 21,
> so a reduction is carried as a negative fraction and the panel shows its size.
>
> Bit 22 sets the countdown a client shows on the champion's passive. It is a
> moment on the match clock (see [Time](time.md)), in seconds, on the same clock as the time a
> `ClockSync` carries, and not the time left: 120 at the opening of a match starts
> the countdown from 2:00. Once that moment has passed, the passive shows ready.
> Bit 23 is how long the whole cooldown lasts, in seconds, and a client shades the
> passive's icon by the time left over that length; the countdown itself follows
> bit 22 alone.
>
> ## A turret
>
> | Group | Bits    | Value                                                                      | Shape    |
> | ----- | ------- | -------------------------------------------------------------------------- | -------- |
> | 1     | 0 to 1  | Resource at its greatest, then as it stands                                | measured |
> | 1     | 2 to 6  | What the turret is doing, and four kinds of harm it is proof against       | counted  |
> | 1     | 7       | Damage it deals by striking                                                | measured |
> | 1     | 8       | Armour                                                                     | measured |
> | 1     | 9 to 14 | Spell resistance, the modifiers on its damage, and how fast health returns | measured |
> | 3     | 0 to 1  | Health as it stands, then at its greatest                                  | measured |
> | 3     | 2 to 3  | How far it sees                                                            | measured |
> | 3     | 4       | How fast it moves                                                          | measured |
> | 3     | 5       | Its size                                                                   | measured |
> | 5     | 0 to 1  | Whether anything is allowed to aim at it, and which side is                | counted  |
>
> Where a server raises a turret's health at its greatest, it raises health as it
> stands to the same value.
>
> ## A minion, and a unit belonging to no side
>
> Both answer to one table.
>
> | Group | Bits     | Value                                                                      | Shape    |
> | ----- | -------- | -------------------------------------------------------------------------- | -------- |
> | 1     | 0 to 1   | Health as it stands, then at its greatest                                  | measured |
> | 1     | 2 to 4   | How long it lives, as it stands and at its greatest, and the count of that | measured |
> | 1     | 5 to 6   | Resource at its greatest, then as it stands                                | measured |
> | 1     | 7 to 11  | What the unit is doing, and four kinds of harm it is proof against         | counted  |
> | 1     | 12       | Damage it deals by striking                                                | measured |
> | 1     | 13 to 31 | Its defences and the modifiers on them                                     | measured |
> | 3     | 0 to 1   | How far it sees                                                            | measured |
> | 3     | 2        | How fast it moves                                                          | measured |
> | 3     | 3        | Its size                                                                   | measured |
> | 3     | 4 to 5   | Whether anything is allowed to aim at it, and which side is                | counted  |
>
> ## A building
>
> Inhibitors and nexuses, each named by the identifier
> [Objects and identifiers](objects.md#net-ids-of-what-a-map-holds) gives its
> name. Where a server replicates a map's buildings, it sends these two groups and
> nothing else. On map 8 it replicates none.
>
> | Group | Bits   | Value                                                       | Shape    |
> | ----- | ------ | ----------------------------------------------------------- | -------- |
> | 1     | 0      | A health figure                                             | measured |
> | 1     | 1      | Whether the building is proof against harm                  | counted  |
> | 5     | 0 to 1 | Whether anything is allowed to aim at it, and which side is | counted  |
>
> The health figure does not follow the building's health. A server SHOULD send
> an inhibitor's as 4000 on maps 1 and 11 and 3000 on map 10, a nexus's as 5500 on those three, and every
> building's as 0 on map 12. A server SHOULD NOT change it, even as a building
> is destroyed. A server first names a building in the `EnterSight` that brings it
> into a side's sight.
>
> ## A prop
>
> A server need not replicate a prop's values. Where it does, they follow the
> table below.
>
> | Group | Bits   | Value                                                       | Shape    |
> | ----- | ------ | ----------------------------------------------------------- | -------- |
> | 1     | 0 to 1 | Health as it stands, then at its greatest                   | measured |
> | 1     | 2      | Whether the prop is proof against harm                      | counted  |
> | 3     | 0 to 1 | How far it sees                                             | measured |
> | 3     | 2      | How fast it moves                                           | measured |
> | 3     | 3      | Its size                                                    | measured |
> | 3     | 4 to 5 | Whether anything is allowed to aim at it, and which side is | counted  |

## Values stated outside a batch

Besides its batches, a server states some values with messages of their own.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A server grants gold with `GoldGained`. `ExperienceGained` shows the
> experience gained over the unit and grants none: a champion's experience
> follows its replicated values alone.

<!-- holds from 0.9.25.24 up to 1.0.0.127 -->

> **In 0.9.25.24–1.0.0.126**
>
> A server grants experience with `ExperienceGained` and gold with `GoldGained`.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A server grants experience with `ExperienceGained`, and MUST name a champion
> in it: a client fails on one naming any other unit. `GoldGained` shows the
> gold gained over the unit and grants none: a champion's gold in hand follows
> group 0 bit 0 of its batches alone.

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> A server grants experience with `ExperienceGained` and gold with `GoldGained`.

A server can send the gold a unit earns to another with `GoldRedirect`. A level
gained is `LevelUp`, which on its own is enough for a client to show the new
level on its champion's portrait. A server sets a champion's tallies for the
scoreboard with `ChampionStats`. A server can also add to a unit's shield
(`ShieldAdded`), change how its health bar or resource bar is shown
(`HealthBar`, `ResourceDisplay`), change the sort of resource it has
(`ResourceKindChanged`), set the highest level a champion reaches
(`LevelCap`), and count minions killed, scores and deeds (`MinionKillCount`,
`ScoreAdded`, `StatisticIncremented`).

<!-- messages -->
