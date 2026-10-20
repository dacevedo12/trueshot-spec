# Spells

<!-- place: cast-sequence -->

`SpellCastAnswer` is both the answer to the client that asked and what every
client sees of the cast; there is nothing else to send it. Its casting record
names the spell by the hash of its name, and a client casts nothing for a spell
it has not loaded or for a record whose length disagrees with its count of
targets. A client applies the cost and the cooldown only where the record names the
caster. As the cast lets go, a client starts the slot's cooldown from the
record, where that is longer than what remains, spends the record's cost, and
launches the record's missile itself while the caster is in view.

A cast the client takes also places the caster at the record's launch point,
unless the record says to keep it, so a server sends where the caster stands.
The answer's movement sync id is counted with the paths a unit takes (see
[Ordering](../../ordering.md)).

A client lets its player cast from a slot only where the spell in it has a
level above zero, its castable bit is set, it is off cooldown, its cost is
within the champion's mana, and the champion's action state allows casting.

<!-- place: levelling -->

A client spends the point as it sends `UpgradeSpell`, and asks only where the
champion has a point to spend, is of the level the slot requires, and the spell
is below its highest level. `LevelUp` states the champion's level and its
points. A request a server never answers leaves the level as it was and the
point spent, until the next `SpellUpgraded` or `LevelUp`.
