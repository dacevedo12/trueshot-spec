# The match

How a match runs once play has begun, apart from the field: its clock, holds,
its end, and players leaving and coming back.

## The clock

A server states how long the match has run with `ClockSync`. [Time](time.md) says how the
match clock is kept, and which clock each time on the wire is measured
against.

`GameSpeed` sets how fast the match runs. `StatTick` hands every unit a span of
seconds.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> For `StatTick`, the units a client advances gain their health and mana
> regeneration over that span, up to their maxima; a dead unit does not
> advance.

<!-- holds from 0.9.25.24 up to 4.20.0.315 -->

> **In 0.9.25.24–4.19**
>
> A client shows the speed `GameSpeed` sets over its champion. A client changes
> nothing it shows for `StatTick`.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A `GameSpeed` other than 0 takes effect at once: sent during a hold, it ends
> the hold, and a `Resumed` after it changes nothing. One of 0 sent during a hold
> leaves the match held. A `Resumed` that arrives while the speed is 0, held or
> not, sets the match going at the speed it had when the last hold began.
>
> No unit advances for `StatTick`.

<!-- holds from 1.0.0.25 up to 1.0.0.58 -->

> **In 1.0.0.25–1.0.0.57**
>
> A `GameSpeed` other than 0 takes effect at once: sent during a hold, it ends
> the hold, and a `Resumed` after it changes nothing. One of 0 sent during a hold
> leaves the match held. A `Resumed` that arrives while the speed is 0, held or
> not, sets the match going at the speed it had when the last hold began.

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> The speed `GameSpeed` sets takes effect at once: sent during a hold, it ends
> the hold, and a `Resumed` after it changes nothing.

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> A server MUST NOT send `GameSpeed` before the client's own champion exists,
> because a client given one before then fails.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> Sent during a hold, `GameSpeed` takes effect as the match resumes.

<!-- holds from 1.0.0.140 up to 4.18.0.271 -->

> **In 1.0.0.140–4.17**
>
> No unit advances for `StatTick`.

## Holding and resuming

A client asks to hold the match with `Pause`, and to resume it with `Resume`. A
server MUST attribute each to the connection it arrived on (see [Objects and
identifiers](objects.md)).

<!-- holds from 1.0.0.126 up to 4.18.0.271 -->

> **In 1.0.0.126–4.17**
>
> A client names no one in `Pause` or `Resume`.

<!-- holds from 4.18.0.271 up to 4.21.0.0 -->

> **In 4.18–4.20**
>
> A client puts 0 in the client id of `Pause` and `Resume`, the same id as the
> first seat's, so a server takes no seat from that field.

A server holds the match with `Paused`.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client reads nothing from `Paused`, keeps the speed it had, and shows
> nothing.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> A hold stops the match clock where it is running, until play resumes.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> `Paused` carries how long the hold can last, in seconds.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> A client begins a hold only where the time `Paused` carries is above zero and
> the match is not already held.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> Where the message's flag is set, a client announces in chat the player that
> held the match, unless the message names no one, and, where it has a player of
> its own, shows a box with the time left. A hold with the flag clear shows
> nothing.

<!-- holds from 1.0.0.140 up to 4.20.0.315 -->

> **In 1.0.0.140–4.19**
>
> A client shows a tournament's hold, crediting the seat that asked, where the
> message says it is one.

<!-- holds from 1.0.0.140 up to 1.0.0.151 -->

> **In 1.0.0.140–1.0.0.150**
>
> A client shows nothing for any other hold. A tournament's hold also shows a
> box with the time left and locks input, and only such a hold locks it. A
> client announces no hold whose message names no one.

<!-- holds from 3.03.0.198 up to 3.11.0.306 -->

> **In 3.03–3.10**
>
> A client shows nothing for any other hold. A tournament's hold also shows a
> box with the time left and locks input, and only such a hold locks it. A
> client announces no hold whose message names no one.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> Where `Paused`'s flag is set and the hold begins, a client announces in chat
> the player whose client id it carries, unless that id is 4294967295. Where
> the flag is clear, it holds without announcing.

A server ends the hold with `Resumed`.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client reads nothing from `Resumed`. Where the match is held, it goes on at
> once at the speed it had, with no countdown and no announcement.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> `Resumed` ends the hold either at once or after a countdown, during which the
> match stays held. A client shows the countdown only where the hold it ends had
> its flag set, and ignores a `Resumed` with a countdown that arrives while one
> runs.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> `Resumed` ends the hold either at once or after a countdown, during which the
> match stays held. A client shows the countdown only for a tournament's hold. A
> `Resumed` arriving while the match is not held leaves the match as it is.

<!-- holds from 1.0.0.150 up to 1.0.0.151 -->

> **In 1.0.0.150**
>
> `Resumed` ends the hold either at once or after a countdown, during which the
> match stays held. A client shows the countdown only for a tournament's hold,
> and ignores a `Resumed` with a countdown that arrives while one runs. A
> `Resumed` arriving while the match is not held leaves the match as it is.

<!-- holds from 3.03.0.198 up to 3.04.0.78 -->

> **In 3.03**
>
> `Resumed` ends the hold either at once or after a countdown, during which the
> match stays held. A client shows the countdown only for a tournament's hold,
> and ignores a `Resumed` with a countdown that arrives while one runs. A
> `Resumed` with a countdown that arrives while the match is not held leaves the
> match as it is.

<!-- holds from 3.6.0.388 up to 3.7.0.328 -->

> **In 3.6**
>
> `Resumed` ends the hold either at once or after a countdown, during which the
> match stays held. A client shows the countdown only for a tournament's hold,
> and ignores a `Resumed` with a countdown that arrives while one runs. A
> `Resumed` arriving while the match is not held leaves the match as it is.

<!-- holds from 3.7.0.328 up to 3.13.0.399 -->

> **In 3.7–3.12**
>
> `Resumed` ends the hold either at once or after a countdown the client shows,
> during which the match stays held.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> `Resumed` ends the hold either at once or after a countdown, during which the
> match stays held. A client shows the countdown only for a tournament's hold,
> and ignores a `Resumed` with a countdown that arrives while one runs. A
> `Resumed` arriving while the match is not held leaves the match as it is.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> `Resumed` ends the hold either at once or after a countdown, during which the
> match stays held.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client announces in chat who resumed the match only where it resumes at
> once, and does so even where the match was not held.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> A client announces in chat who resumed the match.

<!-- holds from 1.0.0.140 up to 1.0.0.151 -->

> **In 1.0.0.140–1.0.0.150**
>
> A client announces who resumed the match even where it was not held, and
> announces nothing where `Resumed` names no one.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> Input stays locked during the countdown.

<!-- holds from 3.03.0.198 up to 3.11.0.306 -->

> **In 3.03–3.10**
>
> A client announces who resumed the match even where it was not held, and
> announces nothing where `Resumed` names no one.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Input stays locked during the countdown.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client shows the countdown only for a tournament's hold. A `Resumed` with a
> countdown, arriving while the match is not held, leaves the match clock as it
> is.

## The end

A server ends the match with `GameEnded`, saying which side won, and sends
`HudDisabled` (see [The interface](interface.md#the-minimap-and-text-on-screen)). A client shows the win or loss for its
player's side and sends `ClientFinished`.

<!-- holds from 0.8.13.26 up to 1.0.0.110 -->

> **In 0.8.13.26–1.0.0.109**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, while
> playing a replay too.

<!-- holds from 1.0.0.110 up to 1.0.0.111 -->

> **In 1.0.0.110**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play.

<!-- holds from 1.0.0.111 up to 1.0.0.124 -->

> **In 1.0.0.111–1.0.0.123**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, while
> playing a replay too.

<!-- holds from 1.0.0.124 up to 1.0.0.125 -->

> **In 1.0.0.124**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, and
> none while playing a replay.

<!-- holds from 1.0.0.125 up to 1.0.0.132 -->

> **In 1.0.0.125–1.0.0.131**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, while
> playing a replay too.

<!-- holds from 1.0.0.132 up to 1.0.0.133 -->

> **In 1.0.0.132**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play.

<!-- holds from 1.0.0.133 up to 1.0.0.141 -->

> **In 1.0.0.133–1.0.0.140**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, while
> playing a replay too.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client that receives `GameEnded` while still loading takes it as in play
> once its own champion exists: it records the result and sends
> `ClientFinished`. Before then it fails on it, recording nothing and sending
> nothing, so a server MUST NOT send `GameEnded` before the client's own
> champion is created.

<!-- holds from 0.9.22.14 up to 0.9.25.36 -->

> **In 0.9.22.14–0.9.25.35**
>
> A client that receives `GameEnded` while still loading takes it as in play:
> it records the result and sends `ClientFinished`.

<!-- holds from 1.0.0.58 up to 1.0.0.150 -->

> **In 1.0.0.58–1.0.0.149**
>
> A client that receives `GameEnded` while still loading leaves at once.

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> Before it leaves, it shows an error where it has no champion of its own yet.

<!-- holds from 1.0.0.132 up to 1.0.0.133 -->

> **In 1.0.0.132**
>
> Before it leaves, it shows an error where it has no champion of its own yet.

<!-- holds from 1.0.0.150 up to 1.0.0.151 -->

> **In 1.0.0.150**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, and
> none while watching a match or playing a replay. A client that receives
> `GameEnded` while still loading sends neither `ClientFinished` nor `Exit`.
> Where it has a champion of its own it leaves at once; otherwise it first shows
> an error, and leaves once its player dismisses it.

<!-- holds from 3.03.0.198 up to 3.7.0.328 -->

> **In 3.03–3.6**
>
> A client that receives `GameEnded` while still loading sends neither
> `ClientFinished` nor `Exit`. Where it has a champion of its own it leaves at
> once; otherwise it first shows an error, and leaves once its player dismisses
> it.

<!-- holds from 3.03.0.198 up to 3.04.0.78 -->

> **In 3.03**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, and
> not while it plays a match back, from a replay, a spectator stream or over
> its game connection.

<!-- holds from 3.7.0.328 up to 3.13.0.399 -->

> **In 3.7–3.12**
>
> A client that receives `GameEnded` while still loading leaves at once.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, and
> not while playing a replay.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> A client that receives `GameEnded` while still loading sends neither
> `ClientFinished` nor `Exit`. Where it has a champion of its own it leaves at
> once; otherwise it first shows an error, and leaves once its player dismisses
> it.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client sends no `ClientFinished` while playing a replay.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client that receives `GameEnded` while still loading leaves.

<!-- holds from 4.4.0.1858 up to 4.5.0.260 -->

> **In 4.4**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play. One
> that receives `GameEnded` while still loading sends neither `ClientFinished`
> nor `Exit`; where it has no champion of its own yet, it first shows an error,
> and leaves once its player dismisses it.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play. One
> that receives `GameEnded` while still loading sends neither `ClientFinished`
> nor `Exit`; where it has no champion of its own yet, it first shows an error,
> and leaves once its player dismisses it.

`VictoryDance` sets units moving as winners or losers do. It ends nothing.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client moves no neutral unit for `VictoryDance`.

<!-- holds from 1.0.0.140 up to 3.11.0.306 -->

> **In 1.0.0.140–3.10**
>
> A client moves no neutral unit for `VictoryDance`.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client moves no neutral unit and no dead unit for `VictoryDance`.

## Leaving and coming back

A client leaving as one abandoning the match sends `Exit` as its player quits.
A client also leaves at once on `BotKick` with the action that means leave.

<!-- holds from 0.8.13.26 up to 1.0.0.110 -->

> **In 0.8.13.26–1.0.0.109**
>
> A client also leaves as one abandoning the match as its player closes the
> window, and as an attempt to connect again does not succeed.

<!-- holds from 1.0.0.110 up to 1.0.0.111 -->

> **In 1.0.0.110**
>
> A client also leaves as one abandoning the match as its player closes the
> window.

<!-- holds from 1.0.0.111 up to 1.0.0.132 -->

> **In 1.0.0.111–1.0.0.131**
>
> A client also leaves as one abandoning the match as its player closes the
> window, and as an attempt to connect again does not succeed.

<!-- holds from 1.0.0.130 up to 4.21.0.0 -->

> **In 1.0.0.130–4.20**
>
> A client also sends `Exit` on a server's `Shutdown`, which has it leave at
> once.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> A client also leaves as one abandoning as its player declines to reconnect or
> cancels a reconnection under way, and as its player dismisses the notice that
> it was dropped for being away.

<!-- holds from 1.0.0.133 up to 4.21.0.0 -->

> **In 1.0.0.133–4.20**
>
> A client also leaves as one abandoning the match as its player closes the
> window, and as an attempt to connect again does not succeed.

<!-- holds from 1.0.0.140 up to 4.18.0.271 -->

> **In 1.0.0.140–4.17**
>
> The action of `BotKick` that means leave is 4.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client also leaves as one abandoning the match as its player dismisses the
> notice that it was dropped for being away.

<!-- holds from 4.18.0.271 up to 4.21.0.0 -->

> **In 4.18–4.20**
>
> The action of `BotKick` that means leave is 5.

A server tells the others that a player's client dropped with
`PlayerDisconnected`.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client whose connection drops, while loading or in play, shows its player
> that it was disconnected, and neither connects again nor leaves.

<!-- holds from 0.9.25.24 up to 4.20.0.315 -->

> **In 0.9.25.24–4.19**
>
> A client shows a notice in chat for `PlayerDisconnected`.

<!-- holds from 0.9.25.24 up to 3.13.0.399 -->

> **In 0.9.25.24–3.12**
>
> A client started again for a match in progress knows nothing of it, and joins
> as at the start: a server takes it through [Joining a match](joining.md)
> from registering to `StartGame`, with a spawn run that states the field as it
> stands, and a `ClockSync`.
>
> A client the server drops with the reason that means its player was away
> shows that, and does not connect again.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client shows that notice only where it holds the champion
> `PlayerDisconnected` names, other than its own, and only on the side the
> message's flags choose.

<!-- holds from 1.0.0.150 up to 1.0.0.151 -->

> **In 1.0.0.150**
>
> A client shows that notice only in play, only where it holds the champion
> `PlayerDisconnected` names, other than its own, and only on the side the
> message's flags choose.

<!-- holds from 3.03.0.198 up to 3.04.0.78 -->

> **In 3.03**
>
> A client shows that notice only in play, only where it holds the champion
> `PlayerDisconnected` names, other than its own, and only on the side the
> message's flags choose.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client shows that notice only where it holds the champion
> `PlayerDisconnected` names.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> A client shows that notice only in play, only where it holds the champion
> `PlayerDisconnected` names, other than its own, and only on the side the
> message's flags choose.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> A client started again for a match in progress knows nothing of it, and joins
> as at the start: a server takes it through [Joining a match](joining.md) from
> registering to `StartGame`, with a spawn run that states the field as it
> stands, and a `ClockSync`.
>
> A client dropped during play with the reason that means its player was away
> shows that, and does not connect again.

<!-- holds from 3.14.0.700 up to 4.21.0.0 -->

> **In 3.14–4.20**
>
> A client started again for a match in progress knows nothing of it, and joins
> as at the start: a server takes it through [Joining a match](joining.md)
> from registering to `StartGame`, with a spawn run that states the field as it
> stands, and a `ClockSync`.
>
> A client the server drops with the reason that means its player was away
> shows that, and does not connect again.

<!-- holds from 4.4.0.1858 up to 4.5.0.260 -->

> **In 4.4**
>
> A client shows that notice only in play, only where it holds the champion
> `PlayerDisconnected` names, other than its own, and only on the side the
> message's flags choose.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> A client sends `ReconnectedInMatch` on every connection it makes, the first
> included, with a byte that is 0 where the match is in play and 1 otherwise.
>
> `Reconnected` announces that a player came back. A client shows it in chat for
> any other player, ally or enemy.

<!-- holds from 0.9.25.24 up to 1.0.0.127 -->

> **In 0.9.25.24–1.0.0.126**
>
> A client dropped during play connects again only where its player agrees: for
> the reason 0 it asks, and on a yes connects again, showing that it is
> reconnecting until it is back or its player cancels. For any other reason but
> the one that means its player was away, it shows that it could not connect
> again.
>
> Where `Reconnected` names the client's own, the client resynchronises until
> `ResyncEnded`.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client whose connection drops before play begins, once the registration
> answer has given it its own client id, leaves rather than connecting again.

<!-- holds from 1.0.0.25 up to 1.0.0.58 -->

> **In 1.0.0.25–1.0.0.57**
>
> While it resynchronises, a client ignores `SpawnFromBarracks`, `SpawnUnit` and
> `CreateNeutral` naming a unit it already holds, a `CreateNeutral` or a
> `SpawnUnit` for a unit it does not hold whose `asset` is empty, a
> `SpawnFromBarracks` for a unit it does not hold whose `kind` is above 4, and a
> `UnitDied` naming a unit it does not hold.

<!-- holds from 1.0.0.58 up to 1.0.0.61 -->

> **In 1.0.0.58–1.0.0.60**
>
> A client sends `ReconnectedInMatch` right after the registration answer.
>
> While it resynchronises, a client ignores `SpawnFromBarracks`, `SpawnUnit` and
> `CreateNeutral` naming a unit it already holds, a `CreateNeutral` or a
> `SpawnUnit` for a unit it does not hold whose `asset` is empty, and a
> `SpawnFromBarracks` for a unit it does not hold whose `kind` is above 4.

<!-- holds from 1.0.0.74 up to 1.0.0.75 -->

> **In 1.0.0.74**
>
> A client sends `ReconnectedInMatch` as the connection is made, right after its
> registration request, without waiting for the registration answer.

<!-- holds from 1.0.0.86 up to 1.0.0.87 -->

> **In 1.0.0.86**
>
> A client sends `ReconnectedInMatch` as the `Registered` naming its own player
> id arrives, not as the connection is made.

<!-- holds from 1.0.0.96 up to 1.0.0.127 -->

> **In 1.0.0.96–1.0.0.126**
>
> While it resynchronises, a client ignores `SpawnFromBarracks`, `SpawnUnit` and
> `CreateNeutral` naming a unit it already holds.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> While it resynchronises, a client also ignores a `CreateNeutral` or a
> `SpawnUnit` for a unit it does not hold whose `asset` is empty, and a
> `SpawnFromBarracks` for a unit it does not hold whose `kind` is above 4.

<!-- holds from 1.0.0.110 up to 1.0.0.111 -->

> **In 1.0.0.110**
>
> A client whose connection drops before play begins, once the registration
> answer has given it its own client id, leaves rather than connecting again.

<!-- holds from 1.0.0.111 up to 1.0.0.140 -->

> **In 1.0.0.111–1.0.0.139**
>
> A client whose connection drops before play begins leaves rather than
> connecting again.

<!-- holds from 1.0.0.140 up to 3.11.0.306 -->

> **In 1.0.0.140–3.10**
>
> Where a setting of its own allows it, a client dropped during play connects
> again at once by itself, for any reason but the one that means its player was
> away, and shows its player that it is reconnecting while it does. Where that
> setting is off, it asks its player for the reason 0 whether to connect again,
> and for any reason but that and the one that means its player was away shows
> that it could not connect again.

<!-- holds from 1.0.0.140 up to 1.0.0.150 -->

> **In 1.0.0.140–1.0.0.149**
>
> A client sends `ReconnectedInMatch` as the connection is made, without waiting
> for the registration answer.

<!-- holds from 1.0.0.150 up to 1.0.0.151 -->

> **In 1.0.0.150**
>
> A client sends `ReconnectedInMatch` as the connection is made, without
> waiting for the registration answer, and only where the match is in play, so
> never on its first connection.

<!-- holds from 3.03.0.198 up to 3.04.0.78 -->

> **In 3.03**
>
> A client sends `ReconnectedInMatch` as the `Registered` naming its own player
> id arrives, not as the connection is made, and only while the match is in
> play.

<!-- holds from 3.6.0.388 up to 3.7.0.328 -->

> **In 3.6**
>
> A client sends `ReconnectedInMatch` as the `Registered` naming its own player
> id arrives, not as the connection is made.

<!-- holds from 3.10.0.237 up to 4.20.0.315 -->

> **In 3.10–4.19**
>
> `Reconnected` announces that another player came back. A client shows it for
> an ally, or for anyone while it watches the match, and only notes it where it
> names its own client.

<!-- holds from 3.10.0.237 up to 3.14.0.700 -->

> **In 3.10–3.13**
>
> A client whose connection drops before play begins leaves rather than
> connecting again once it knows its own client id, and connects again before
> then.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client sends `ReconnectedInMatch` only on a connection made after it has
> taken `StartGame`, so never on its first connection.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> A client sends `ReconnectedInMatch` as the connection is made, before any
> `Registered`, and only while the match is in play and it is not playing a
> replay.

<!-- holds from 4.4.0.1858 up to 4.18.0.271 -->

> **In 4.4–4.17**
>
> A client whose connection drops before play begins leaves rather than
> connecting again once it knows its own client id, and connects again before
> then.

<!-- holds from 4.4.0.1858 up to 4.5.0.260 -->

> **In 4.4**
>
> Where a setting of its own allows it, a client dropped during play connects
> again at once by itself, for any reason but the one that means its player was
> away. Where that setting is off, it asks its player for the reason 0 whether
> to connect again, and for any reason but that and the one that means its
> player was away shows that it could not connect again. A client registers again
> on every connection it makes, a new one after a drop included.
>
> A client sends `ReconnectedInMatch` as the connection is made, before any
> `Registered`, and only while the match is in play and it is not watching it.

<!-- holds from 4.5.0.260 up to 4.17.0.233 -->

> **In 4.5–4.16**
>
> A client dropped during play connects again by itself, registers again, and
> sends `ReconnectedInMatch` right after the registration answer.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client dropped during play connects again by itself, registers again, and
> sends `ReconnectedInMatch` as soon as the connection is made, straight after
> its `Register`, without waiting for the registration answer.

<!-- holds from 4.18.0.271 up to 4.21.0.0 -->

> **In 4.18–4.20**
>
> A client dropped during play connects again by itself, registers again, and
> sends `ReconnectedInMatch` right after the registration answer.

[Objects and identifiers](objects.md#a-soft-reconnect) says what `SoftReconnect`
does.

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> A server MUST NOT send `SpawnStart` to a client that connects again by itself
> after a drop: it returns the client to spawning, from which only another
> `StartGame` brings it back into play.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client dropped during play connects again to the same address and port, and
> shows its player that it is reconnecting until it is back. It goes on where it
> was: it asks for no status and no version, loads nothing, and keeps every
> seat, name and identifier it held. A server answers with `SoftReconnect`.

## Staying connected

<!-- holds from 0.9.25.24 up to 1.0.0.127 -->

> **In 0.9.25.24–1.0.0.126**
>
> A client gives up on a connection where a reliable message it sent goes
> unacknowledged for 30 seconds, while loading and in play alike.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> Once loading is done, a client gives up on a connection where a reliable
> message it sent goes unacknowledged for 15 seconds.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> Before loading is done, a client waits 60 seconds for an acknowledgement rather
> than 15.

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> Where it has heard nothing for 5 seconds in play, a client shows its player
> that it is trying to reconnect, and clears the notice as soon as anything
> arrives.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> In play a client sends nothing to show it is still there but what answers what
> it is sent (`ClockReply`, `TransientAck`, `WaypointAck`), what follows from
> its player, and its view reports (`Camera`), which go out again until a
> server answers them, with no input from its player
> ([Ordering](ordering.md#what-a-server-answers)).

<!-- messages -->
