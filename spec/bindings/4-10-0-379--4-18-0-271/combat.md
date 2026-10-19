# Combat

<!-- place: stop-attack -->

After `StopAttack`, a client clears the unit's attack whatever the message's flags ask besides.

<!-- place: damage -->

A client shows nothing at all for `Damage` unless it holds both the unit hurt and the unit dealing it.

<!-- place: death -->

A client ignores `ChampionDied` that credits no killer, or names a champion
already dead, and puts a unit down on `UnitDied` only where a killer is named.

<!-- place: using-a-unit -->

## Using a unit

A client sends `UseObject` as its player right-clicks a unit that can be
used, and also, for a unit its champion is attacking, as that unit changes side.
