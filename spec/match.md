# The match

How a match runs once play has begun, apart from what happens on the field: its
clock, holding it and resuming it, its end, and players leaving and coming back.

## The clock

A server states how long the match has run with `ClockSync`, and a client
answers on the clock channel with `ClockReply`. [Time](time.md) says how the
match clock is kept, and which clock each time on the wire is measured
against.

`GameSpeed` sets how fast the match runs. `StatTick` asks every unit's stats to
advance by a span of seconds.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> `GameSpeed` sets how fast a client's game clock runs (see
> [Time](time.md)), from 0 to 10 times normal, and shows the new speed over
> its champion; sent during a hold, it takes effect as the match resumes. A client
> changes nothing it shows for `StatTick`.

## Holding and resuming

A client asks to hold the match with `Pause`, and to resume it with `Resume`. A
server MUST attribute each to the connection it arrived on (see [Objects and
identifiers](objects.md)).

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client names no one in `Pause` or `Resume`.

A server holds the match with `Paused`, carrying how long the hold can last, in
seconds.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client begins a hold only where the time `Paused` carries is above zero and the
> match is not already held, and shows a tournament's hold, crediting the seat that asked,
> where the message says it is one.

A server ends the hold with `Resumed`, either
at once or after a countdown the client shows, during which input stays
locked; a client announces in chat who resumed it.

## The end

A server ends the match with `GameEnded`, saying which side won, and takes the
interface down with `HudDisabled`. A client shows the win or loss for its player's
side and sends `ClientFinished` once, except while playing a replay.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client that receives `GameEnded` while still loading leaves at once.

`VictoryDance` sets every unit moving as winners or losers do. It ends nothing.

## Leaving and coming back

A client leaving as one abandoning the match sends `Exit`: as its player quits
or closes the window, as a reconnection fails, or on a server's `Shutdown`, which has it leave at once. A client also
leaves at once on `BotKick` with the action that means leave, which each range
names.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> The action of `BotKick` that means leave is 4.

<!-- holds from 4.18.0.271 up to 4.21.0.0 -->

> **In 4.18–4.20**
>
> The action of `BotKick` that means leave is 5.

A server tells the others that a player's client dropped with
`PlayerDisconnected`.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client shows a notice in chat for `PlayerDisconnected`.

A client dropped during play connects again by itself, registers again, and sends
`ReconnectedInMatch` right after the registration answer; one dropped while
loading leaves instead. `SoftReconnect` rebuilds a client's world without a new connection, as
[Objects and identifiers](objects.md) describes.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client started again for a match in progress knows nothing of it, and joins
> as at the start: a server takes it through [Joining a match](joining.md)
> from registering to `StartGame`, with a spawn run that states the field as it
> stands, and a `ClockSync`.
>
> A client dropped during play connects again to the same address and port, and
> shows its player that it is reconnecting until it is back. It registers again,
> sends `ReconnectedInMatch` as the answer naming it arrives, and goes on where it
> was: it asks for no status and no version, loads nothing, and keeps every
> seat, name and identifier it held. A server answers with `SoftReconnect`'s
> stage that marks, then a message creating each unit the client is to hold,
> each of which replaces whatever the client held under its identifier, then the
> stage that sweeps away whatever is still marked. A server MUST NOT send
> `SpawnStart` to a client coming back this way: it returns the client to
> spawning, from which only another `StartGame` brings it back into play.
>
> A client the server drops with the reason that means its player was away
> shows that, and does not connect again.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> `Reconnected` announces that another player came back. A client shows it for
> an ally, or for anyone while it watches the match, and only notes it where it
> names its own client.

## Staying connected

How long a client waits on a server that has gone quiet, and what it sends
meanwhile, is each range's own.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Once loading is done, a client gives up on a connection where a reliable
> message it sent goes unacknowledged for 15 seconds. Where it has heard nothing
> for 5 seconds in play, it shows its player that it is trying to reconnect, and
> clears the notice as soon as anything arrives.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> Before loading is done, a client waits 60 seconds for an acknowledgement rather
> than 15. In play it sends nothing on its own to show it is still there: what it
> sends answers what it is sent (`ClockReply`, `TransientAck`, `WaypointAck`) or
> follows from its player. Its view report, `Camera`, goes out only as its view
> moves at least 200 units, at most every tenth of a second, and never while its
> view is locked.

<!-- messages -->
