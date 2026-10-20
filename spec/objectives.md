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

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> Everything a client shows of a capture point (who holds it, where it stands,
> how far it is taken) comes from the unit `CapturePointChanged` binds it to, so a
> server hands a point over by changing the unit's side and moves it toward
> capture by changing the unit's resource. A client shows the points and the
> score on a panel it builds only where the version answer names the mode ODIN,
> and only once one point is known. Reaching a score ends nothing: the match ends
> as any match does (see [The match](match.md)).

A server can name the unit holding the Ascension with `AscendedUnit`, and send
`RespawnPoint` about points a champion returns to life at.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client acts on `RespawnPoint` only where its screen has such a panel.

## Events the match is told about

`WorldEvent` says something happened that the whole match is told about: the
match's welcome and its first notices, minions coming out, an inhibitor or a
great monster falling, a player leaving. The sort it names settles what follows
it, and each sort's note in its definition says what a client shows for it.

<!-- messages -->
