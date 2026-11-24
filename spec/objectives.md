# Objectives

The parts of a map players compete for besides each other: neutral camps,
points a side can capture and a score, and the events a match tells its
clients about.

## Camps

A camp is a group of units that belong to no side. A server places a camp on the
map and says how it is drawn with `CampMarker`, opens it with `CampOpened` as
its monsters come, and marks it empty with `CampCleared`. The monsters
themselves are units (see [Units](units.md)). A server tells clients watching a
match when a camp is next due with `CampTimer`.

<!-- holds from 0.8.13.26 up to 3.11.0.306 -->

> **In 0.8.13.26–3.10**
>
> A client places a camp where the first of its monsters is created
> (`CreateNeutral`).

<!-- holds from 1.0.0.96 up to 3.11.0.306 -->

> **In 1.0.0.96–3.10**
>
> `CampCleared` sets no time for the camp to fill again: a client keeps the
> state it gives for the camp.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client shows nothing of the state `CampCleared` gives.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> `CampOpened` also places a camp the client does not know yet, where the
> message says. A client announces a camp `CampCleared` empties where the
> message's flag says to.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> A client places a camp where the first of its monsters is created
> (`CreateNeutral`).

<!-- holds from 4.4.0.1858 up to 4.5.0.260 -->

> **In 4.4**
>
> `CampCleared` sets no time for the camp to fill again.

<!-- holds from 4.5.0.260 up to 4.21.0.0 -->

> **In 4.5–4.20**
>
> `CampCleared` also sets when the camp fills again.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> `CampCleared` sets it only where it names a timer.

## Capture points and score

On a map won on score, a server binds each capture point to a unit with
`CapturePointChanged`, and `TeamScore` sets each side's score.

<!-- holds from 1.0.0.126 up to 3.11.0.306 -->

> **In 1.0.0.126–3.10**
>
> A client acts on `TeamScore` once its game screen is up, whatever the mode.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Everything a client shows of a capture point (who holds it, where it stands,
> how far it is taken) comes from the unit `CapturePointChanged` binds it to, so a
> server hands a point over by changing the unit's side and moves it toward
> capture by changing the unit's resource. A client shows the points and the
> score on a panel it builds only where the version answer names the mode ODIN,
> and only once one point is known. Reaching a score ends nothing: the match ends
> as any match does (see [The match](match.md)).

## Other map objectives

A server can name the unit holding the Ascension with `AscendedUnit`, and send
`RespawnPoint` about points a champion returns to life at.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client never acts on `RespawnPoint`.

## Events

`WorldEvent` says something happened that the whole match is told about: the
match's welcome and its first notices, minions coming out, an inhibitor or a
great monster falling, a player leaving. `ClientEvent` tells one client
something happened that concerns a unit. Each names a sort, from one table of
events, and the sort settles the rest of the message and what a client shows.

<!-- messages -->
