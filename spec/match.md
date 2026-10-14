# The match

How a match runs once play has begun, apart from what happens on the field: its
clock, holding it and resuming it, its end, and players leaving and coming back.
Applies to 4.17 and 4.20 clients, as [Versions](versions.md) describes.

## The clock

A server states how long the match has run with `ClockSync`, and a client
answers on the clock channel with `ClockReply`. [Time](time.md) says how the
match clock is kept, and which clock each time on the wire is measured
against.

`GameSpeed` sets how fast a 4.17 client's clock runs, from 0 to 10 times normal,
and shows the new speed over its champion; sent during a hold, it takes effect
as the match resumes. `StatTick` asks every unit's stats to advance by a span of
seconds, and a 4.17 client changes nothing it shows for it.

## Holding and resuming

A client asks to hold the match with `Pause`, and to resume it with `Resume`. A
4.17 client names no one in either, so a server MUST attribute each to the connection it
arrived on (see [Objects and identifiers](objects.md)).

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
or closes the window, as a reconnection fails, or on a server's `Shutdown`, which has it leave at once. A 4.17 client also
leaves at once on `BotKick`; a 4.20 client stays and changes nothing it shows.

A server tells the others that a player's client dropped with
`PlayerDisconnected`, and a 4.17 client shows a notice in chat for it. A
client dropped during play connects again by itself, registers again, and sends
`ReconnectedInMatch` right after the registration answer; one dropped while
loading leaves instead. `SoftReconnect` rebuilds a 4.17 client's world without a new connection, as
[Objects and identifiers](objects.md) describes; a 4.20 client acts on neither half.

## Messages

<!-- messages:begin -->

| Message                                                            | Sent by | 4.17            | 4.20            | What it does                                                                                                                                                                   |
| ------------------------------------------------------------------ | ------- | --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`BotKick`](../schema/messages/BotKick.json)                       | server  | 222 on events   | 222 on events   | Have a client it takes for a program rather than a player leave the match                                                                                                      |
| [`ClientFinished`](../schema/messages/ClientFinished.json)         | client  | 141 on requests | 141 on requests | What a client sends when it has finished with the match                                                                                                                        |
| [`ClockConvergence`](../schema/messages/ClockConvergence.json)     | server  | 118 on clock    | 118 on clock    | What a server sends about how its clock and a client's are being brought together                                                                                              |
| [`ClockReply`](../schema/messages/ClockReply.json)                 | client  | 8 on clock      | 8 on clock      | What a client sends back when a server states the match clock, carrying both readings so the server can tell how far apart they are                                            |
| [`ClockSync`](../schema/messages/ClockSync.json)                   | server  | 193 on events   | 193 on events   | Set a client's idea of how long the match has run                                                                                                                              |
| [`Empty`](../schema/messages/Empty.json)                           | server  | 0 on events     | 0 on events     | A message with no body                                                                                                                                                         |
| [`Exit`](../schema/messages/Exit.json)                             | client  | 143 on requests | 143 on requests | What a client sends as it leaves                                                                                                                                               |
| [`GameEnded`](../schema/messages/GameEnded.json)                   | server  | 198 on events   | 198 on events   | End the match and say which side won                                                                                                                                           |
| [`GameSpeed`](../schema/messages/GameSpeed.json)                   | server  | 18 on events    | 18 on events    | Set how fast the game's clock runs                                                                                                                                             |
| [`HudDisabled`](../schema/messages/HudDisabled.json)               | server  | 188 on events   | 188 on events   | Take down a client's interface as the match ends                                                                                                                               |
| [`Pause`](../schema/messages/Pause.json)                           | client  | 161 on requests | 161 on requests | Hold a match                                                                                                                                                                   |
| [`Paused`](../schema/messages/Paused.json)                         | server  | 161 on events   | 161 on events   | Put the match on hold                                                                                                                                                          |
| [`PlayerDisconnected`](../schema/messages/PlayerDisconnected.json) | server  | 152 on events   | 152 on events   | What a server sends as a player's client drops out                                                                                                                             |
| [`Reconnected`](../schema/messages/Reconnected.json)               | server  | 15 on events    | 15 on events    | Say a client has reconnected                                                                                                                                                   |
| [`ReconnectedInMatch`](../schema/messages/ReconnectedInMatch.json) | client  | 156 on requests | 156 on requests | What a client sends once it has connected again to a match it was playing, right after the server answers its registration                                                     |
| [`Resume`](../schema/messages/Resume.json)                         | client  | 10 on requests  | 10 on requests  | Start a paused match again                                                                                                                                                     |
| [`Resumed`](../schema/messages/Resumed.json)                       | server  | 10 on events    | 10 on events    | Take the match off hold                                                                                                                                                        |
| [`Shutdown`](../schema/messages/Shutdown.json)                     | server  | 229 on events   | 229 on events   | Have a client leave the match at once, as one abandoning it, sending Exit as it goes                                                                                           |
| [`SoftReconnect`](../schema/messages/SoftReconnect.json)           | server  | 239 on events   | 239 on events   | What a server sends, in pairs, to rebuild a client's world without a new connection: the first marks what the client holds, the second deletes whatever is still marked        |
| [`StatTick`](../schema/messages/StatTick.json)                     | server  | 40 on events    | 40 on events    | Advance every unit's stats by a span of time                                                                                                                                   |
| [`Unhandled286`](../schema/messages/Unhandled286.json)             | server  | 286 on events   | 286 on events   | A message that changes nothing a client shows                                                                                                                                  |
| [`VictoryDance`](../schema/messages/VictoryDance.json)             | server  | 197 on events   | 197 on events   | Set every unit on a side moving as winners or losers do: a winning champion dances, a losing one stands idle, and other units play a win or loss animation where they have one |

<!-- messages:end -->
