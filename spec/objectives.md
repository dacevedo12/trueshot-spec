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

## Messages

<!-- messages:begin -->

| Message                                                              | Sent by | 4.17          | 4.20          | What it does                                                                              |
| -------------------------------------------------------------------- | ------- | ------------- | ------------- | ----------------------------------------------------------------------------------------- |
| [`AscendedUnit`](../schema/messages/AscendedUnit.json)               | server  | 292 on events | 292 on events | Name the unit that holds the Ascension                                                    |
| [`CampCleared`](../schema/messages/CampCleared.json)                 | server  | 195 on events | 195 on events | What a server sends as a camp of units that belong to no side is emptied                  |
| [`CampMarker`](../schema/messages/CampMarker.json)                   | server  | 290 on events | 290 on events | Place a camp on the map and say how it is drawn                                           |
| [`CampOpened`](../schema/messages/CampOpened.json)                   | server  | 233 on events | 233 on events | Open a camp of units that belong to no side                                               |
| [`CampTimer`](../schema/messages/CampTimer.json)                     | server  | 278 on events | 278 on events | What a server sends a client watching a match to set when a camp is next due              |
| [`CapturePointChanged`](../schema/messages/CapturePointChanged.json) | server  | 211 on events | 211 on events | What a server sends when something changes about a point one side can take from the other |
| [`DragonBuffCount`](../schema/messages/DragonBuffCount.json)         | server  | none          | 300 on events | Say how many dragon buffs a side holds                                                    |
| [`RespawnPoint`](../schema/messages/RespawnPoint.json)               | server  | 213 on events | 213 on events | What a server sends about the points a champion can choose to return to life at           |
| [`TeamScore`](../schema/messages/TeamScore.json)                     | server  | 212 on events | 212 on events | Set a side's score, where a match is won on score                                         |
| [`WorldEvent`](../schema/messages/WorldEvent.json)                   | server  | 69 on events  | 69 on events  | Say something happened that the whole match is told about                                 |

<!-- messages:end -->
