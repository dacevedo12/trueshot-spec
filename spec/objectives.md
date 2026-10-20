# Objectives

The parts of a map players compete for besides each other: neutral camps,
points a side can capture and a score, and the events the whole match is told
about.

## Camps

A camp is a group of units that belong to no side. A server places a camp on the
map and says how it is drawn with `CampMarker`, opens it with `CampOpened` as
its monsters come, and marks it empty with `CampCleared`, which also sets when
it fills again. The monsters themselves are units (see [Units](units.md)). A
server tells clients watching a match when a camp is next due with `CampTimer`.

## Capture points and score

On a map won on score, a server binds each capture point to a unit with
`CapturePointChanged`, and `TeamScore` sets each side's score.

<!-- binding: capture-points -->

A server can name the unit holding the Ascension with `AscendedUnit`, and send
`RespawnPoint` about points a champion returns to life at.

<!-- binding: respawn-points -->

## Events the match is told about

`WorldEvent` says something happened that the whole match is told about: the
match's welcome and its first notices, minions coming out, an inhibitor or a
great monster falling, a player leaving. The sort it names settles what follows
it, and each sort's note in its definition says what a client shows for it.

<!-- messages -->
