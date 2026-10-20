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

<!-- binding: speed -->

## Holding and resuming

A client asks to hold the match with `Pause`, and to resume it with `Resume`. A
server MUST attribute each to the connection it arrived on (see [Objects and
identifiers](objects.md)).

<!-- binding: hold-requests -->

A server holds the match with `Paused`, carrying how long the hold can last, in
seconds.

<!-- binding: hold -->

A server ends the hold with `Resumed`, either
at once or after a countdown the client shows, during which input stays
locked; a client announces in chat who resumed it.

## The end

A server ends the match with `GameEnded`, saying which side won, and takes the
interface down with `HudDisabled`. A client shows the win or loss for its player's
side and sends `ClientFinished` once, except while playing a replay.

<!-- binding: end -->

`VictoryDance` sets every unit moving as winners or losers do. It ends nothing.

## Leaving and coming back

A client leaving as one abandoning the match sends `Exit`: as its player quits
or closes the window, as a reconnection fails, or on a server's `Shutdown`, which has it leave at once. A client also
leaves at once on `BotKick` with the action that means leave, which each range
names.

<!-- binding: bot-kick -->

A server tells the others that a player's client dropped with
`PlayerDisconnected`.

<!-- binding: disconnected -->

A client dropped during play connects again by itself, registers again, and sends
`ReconnectedInMatch` right after the registration answer; one dropped while
loading leaves instead. `SoftReconnect` rebuilds a client's world without a new connection, as
[Objects and identifiers](objects.md) describes.

<!-- binding: reconnecting -->

## Staying connected

How long a client waits on a server that has gone quiet, and what it sends
meanwhile, is each range's own.

<!-- binding: timeouts -->

<!-- messages -->
