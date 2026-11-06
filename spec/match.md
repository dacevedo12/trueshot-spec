# The match

How a match runs once play has begun, apart from the field: its clock, holds,
its end, and players leaving and coming back.

## The clock

A server states how long the match has run with `ClockSync`, and a client
answers on the clock channel with `ClockReply`. [Time](time.md) says how the
match clock is kept, and which clock each time on the wire is measured
against.

`GameSpeed` sets how fast the match runs. `StatTick` hands every unit a span of
seconds.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> `StatTick` asks every unit's stats to advance by that span.

<!-- holds from 0.9.25.24 up to 4.20.0.315 -->

> **In 0.9.25.24–4.19**
>
> A client shows the speed `GameSpeed` sets over its champion. A client changes
> nothing it shows for `StatTick`.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> The speed `GameSpeed` sets takes effect at once: sent during a hold, it ends
> the hold, and a `Resumed` after it changes nothing.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> No unit advances for `StatTick`.

<!-- holds from 1.0.0.58 up to 4.21.0.0 -->

> **In 1.0.0.58–4.20**
>
> `StatTick` asks every unit's stats to advance by that span.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> Sent during a hold, `GameSpeed` takes effect as the match resumes.

## Holding and resuming

A client asks to hold the match with `Pause`, and to resume it with `Resume`. A
server MUST attribute each to the connection it arrived on (see [Objects and
identifiers](objects.md)).

<!-- holds from 1.0.0.126 up to 4.18.0.271 -->

> **In 1.0.0.126–4.17**
>
> A client names no one in `Pause` or `Resume`.

<!-- holds from 4.18.0.271 up to 4.20.0.315 -->

> **In 4.18–4.19**
>
> A client puts 0 in the client id of `Pause` and `Resume`, the same id as the
> first seat's, so a server takes no seat from that field.

A server holds the match with `Paused`.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client reads nothing from `Paused`. It stops the match clock where the clock
> is running, keeping the speed it had, and shows nothing.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> `Paused` carries how long the hold can last, in seconds.

<!-- holds from 1.0.0.126 up to 4.20.0.315 -->

> **In 1.0.0.126–4.19**
>
> A client begins a hold only where the time `Paused` carries is above zero and
> the match is not already held.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> Where the message's flag asks it, a client announces in chat the player that
> held the match, unless the message names no one. Every hold shows a box with
> the time left.

<!-- holds from 1.0.0.140 up to 4.20.0.315 -->

> **In 1.0.0.140–4.19**
>
> A client shows a tournament's hold, crediting the seat that asked, where the
> message says it is one.

A server ends the hold with `Resumed`.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client reads nothing from `Resumed`. Where the match is held, it goes on at
> once at the speed it had, with no countdown and no announcement.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> `Resumed` ends the hold either at once or after a countdown the client shows,
> during which the match stays held.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client announces in chat who resumed the match only where it resumes at
> once, and does so even where the match was not held.

<!-- holds from 1.0.0.140 up to 4.21.0.0 -->

> **In 1.0.0.140–4.20**
>
> Input stays locked during the countdown, and a client announces in chat who
> resumed the match.

## The end

A server ends the match with `GameEnded`, saying which side won, and takes the
interface down with `HudDisabled`. A client shows the win or loss for its
player's side and sends `ClientFinished`.

<!-- holds from 0.8.13.26 up to 1.0.0.141 -->

> **In 0.8.13.26–1.0.0.140**
>
> A client sends `ClientFinished` every time `GameEnded` arrives in play, while
> playing a replay too.

<!-- holds from 0.8.13.26 up to 0.9.25.36 -->

> **In 0.8.13.26–0.9.25.35**
>
> A client that receives `GameEnded` while still loading takes it as in play:
> it records the result and sends `ClientFinished`.

<!-- holds from 1.0.0.58 up to 4.20.0.315 -->

> **In 1.0.0.58–4.19**
>
> A client that receives `GameEnded` while still loading leaves at once.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client sends `ClientFinished` once, and not while playing a replay.

`VictoryDance` sets units moving as winners or losers do. It ends nothing.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> `VictoryDance` moves every unit.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client moves no neutral unit for `VictoryDance`.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> `VictoryDance` moves every unit.

## Leaving and coming back

A client leaving as one abandoning the match sends `Exit`: as its player quits
or closes the window, as a reconnection fails, or on a server's `Shutdown`,
which has it leave at once. A client also leaves at once on `BotKick` with the
action that means leave.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> A client also leaves as one abandoning as its player declines to reconnect or
> cancels a reconnection under way, and as its player dismisses the notice that
> it was dropped for being away.

<!-- holds from 1.0.0.140 up to 4.18.0.271 -->

> **In 1.0.0.140–4.17**
>
> The action of `BotKick` that means leave is 4.

<!-- holds from 4.18.0.271 up to 4.21.0.0 -->

> **In 4.18–4.20**
>
> The action of `BotKick` that means leave is 5.

A server tells the others that a player's client dropped with
`PlayerDisconnected`.

<!-- holds from 0.9.25.24 up to 4.20.0.315 -->

> **In 0.9.25.24–4.19**
>
> A client shows a notice in chat for `PlayerDisconnected`.

`SoftReconnect` rebuilds a client's world without a new connection, as
[Objects and identifiers](objects.md) describes.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client whose connection drops, while loading or in play, shows its player
> that it was disconnected, and neither connects again nor leaves.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> A client started again for a match in progress knows nothing of it, and joins
> as at the start: a server takes it through [Joining a match](joining.md)
> from registering to `StartGame`, with a spawn run that states the field as it
> stands, and a `ClockSync`.
>
> A client the server drops with the reason that means its player was away
> shows that, and does not connect again.

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
> the one that means its player was away, it shows that the reconnection
> failed. One dropped while loading leaves.
>
> Where `Reconnected` names the client's own, the client resynchronises until
> `ResyncEnded`.

<!-- holds from 1.0.0.58 up to 1.0.0.61 -->

> **In 1.0.0.58–1.0.0.60**
>
> A client sends `ReconnectedInMatch` right after the registration answer.

<!-- holds from 1.0.0.96 up to 1.0.0.127 -->

> **In 1.0.0.96–1.0.0.126**
>
> While it resynchronises, a client ignores any message creating a unit it
> already holds.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client dropped during play connects again at once by itself, for any reason
> but the one that means its player was away, and shows its player that it is
> reconnecting while it does. Where its settings turn this off, it asks its
> player for the reason 0 whether to connect again, and for any other shows that
> the reconnection failed.
>
> A client sends `ReconnectedInMatch` as the connection is made, without waiting
> for the registration answer.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client dropped during play connects again by itself, registers again, and
> sends `ReconnectedInMatch` right after the registration answer; one dropped
> while loading leaves instead.
>
> A client dropped during play connects again to the same address and port, and
> shows its player that it is reconnecting until it is back. It goes on where it
> was: it asks for no status and no version, loads nothing, and keeps every
> seat, name and identifier it held. A server answers with `SoftReconnect`,
> sending between its two stages a message creating each unit the client is to
> hold. A server MUST NOT send `SpawnStart` to a client coming back this way: it
> returns the client to spawning, from which only another `StartGame` brings it
> back into play.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> `Reconnected` announces that another player came back. A client shows it for
> an ally, or for anyone while it watches the match, and only notes it where it
> names its own client.

## Staying connected

<!-- holds from 0.8.13.26 up to 4.20.0.315 -->

> **In 0.8.13.26–4.19**
>
> A client's view report, `Camera`, goes out as its view moves at least 200
> units, at most every tenth of a second, and never while its view is locked.

<!-- holds from 0.8.13.26 up to 1.0.0.141 -->

> **In 0.8.13.26–1.0.0.140**
>
> Where its last `Camera` goes unacknowledged, a client sends it again without
> its view moving, once more than twice the round trip has passed.

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

<!-- holds from 1.0.0.140 up to 4.20.0.315 -->

> **In 1.0.0.140–4.19**
>
> Before loading is done, a client waits 60 seconds for an acknowledgement rather
> than 15.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Where it has heard nothing for 5 seconds in play, a client shows its player
> that it is trying to reconnect, and clears the notice as soon as anything
> arrives.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> In play a client sends nothing on its own to show it is still there: what it
> sends answers what it is sent (`ClockReply`, `TransientAck`, `WaypointAck`)
> or follows from its player, and `Camera` goes out only as its view moves.

<!-- messages -->
