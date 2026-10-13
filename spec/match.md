# The match

How a match runs once play has begun, apart from what happens on the field: its
clock, holding it and resuming it, its end, and players leaving and coming back.
Applies to 4.20 clients, as [Versions](versions.md) describes.

## The clock

A server states how long the match has run with `ClockSync`, whose first value
is 0 as play begins (see [Joining a match](joining.md)). A client answers on the
clock channel with `ClockReply`, carrying both what the server said and what its
own clock read, so a server can measure how far apart the two are. A 4.17
server also tells a client how the two clocks are being brought together with
`ClockConvergence`.

`GameSpeed` sets how fast a 4.17 client's clock runs, from 0 to 10 times normal,
and shows the new speed over its champion; sent during a hold, it takes effect
as the match resumes. `StatTick` asks every unit's stats to advance by a span of
seconds, and a 4.17 client changes nothing it shows for it.

## Holding and resuming

A client asks to hold the match with `Pause`, and to resume it with `Resume`. A
4.17 client names no one in either, so a server MUST attribute each to the
connection it arrived on.

A server holds the match with `Paused`, carrying how long the hold can last,
in seconds. A
4.17 client begins a hold only where that time is above zero and the match is
not already held, and shows a tournament's hold, crediting the seat that asked,
where the message says it is one. A server ends the hold with `Resumed`, either
at once or after a countdown the client shows, during which input stays
locked; a client announces in chat who resumed it.

## The end

A server ends the match with `GameEnded`, saying which side won, and takes the
interface down with `HudDisabled`. A client shows the win or loss for its player's
side and sends `ClientFinished` once, except while playing a replay. A 4.17
client that receives `GameEnded` while still loading leaves at once.

`VictoryDance` sets every unit moving as winners or losers do. It ends nothing.

## Leaving and coming back

A client leaving as one abandoning the match sends `Exit`: as its player quits
or closes the window, as a reconnection fails, or on a server's `Shutdown` or
`BotKick`, either of which has a 4.17 client leave at once.

A server tells the others that a player's client dropped with
`PlayerDisconnected`, and a 4.17 client shows a notice in chat for it. A 4.17
client dropped during play connects again by itself, registers again, and sends
`ReconnectedInMatch` right after the registration answer; one dropped while
loading leaves instead. `SoftReconnect` rebuilds a 4.17 client's world without
a new connection, in two halves: the first marks every unit the client holds,
and the second removes every unit still marked. In between, a server sends
again each unit the client is to keep.

## Messages

<!-- messages:begin -->

| Message                                                    | Sent by | 4.20            | What it does                                                                                                                        |
| ---------------------------------------------------------- | ------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`ClientFinished`](../schema/messages/ClientFinished.json) | client  | 141 on requests | What a client sends when it has finished with the match                                                                             |
| [`ClockReply`](../schema/messages/ClockReply.json)         | client  | 8 on clock      | What a client sends back when a server states the match clock, carrying both readings so the server can tell how far apart they are |
| [`ClockSync`](../schema/messages/ClockSync.json)           | server  | 193 on events   | Set a client's idea of how long the match has run                                                                                   |
| [`Exit`](../schema/messages/Exit.json)                     | client  | 143 on requests | What a client sends as it leaves                                                                                                    |
| [`GameEnded`](../schema/messages/GameEnded.json)           | server  | 198 on events   | End the match and say which side won                                                                                                |
| [`HudDisabled`](../schema/messages/HudDisabled.json)       | server  | 188 on events   | Take down a client's interface as the match ends                                                                                    |
| [`Pause`](../schema/messages/Pause.json)                   | client  | 161 on requests | Hold a match                                                                                                                        |
| [`Paused`](../schema/messages/Paused.json)                 | server  | 161 on events   | Put the match on hold                                                                                                               |
| [`Resume`](../schema/messages/Resume.json)                 | client  | 10 on requests  | Start a paused match again                                                                                                          |
| [`Resumed`](../schema/messages/Resumed.json)               | server  | 10 on events    | Take the match off hold                                                                                                             |

<!-- messages:end -->
