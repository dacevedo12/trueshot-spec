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

<!-- place: attack-sequence -->

A client never walks its champion into range by itself: a server sends the
`WaypointGroup` that takes it there. Each `Attack` plays one swing, cutting off
any swing still under way; how long a swing takes comes from the champion's
data and its attack speed, not from the message. A melee swing carries a
missile id of zero. A ranged swing carries an id no object holds, which the
client gives the missile it launches itself as the swing lets go, with no
further message while the attacker is in view. `TargetUnit` and
`TargetHeldChampion` are not needed for a swing to show.

`Damage` shows a figure for the results that carry one, normal and critical;
zero is the result that shows the unit as invulnerable, not a plain hit. The
health bar moves only as replication states the unit's health. A swing that
nothing interrupts finishes by itself; `StopAttack` breaks one off before it
lets go.
