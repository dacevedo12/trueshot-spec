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
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/match.md).*

## Holding and resuming

A client asks to hold the match with `Pause`, and to resume it with `Resume`. A
server MUST attribute each to the connection it arrived on (see [Objects and
identifiers](objects.md)).

<!-- binding: hold-requests -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/match.md).*

A server holds the match with `Paused`, carrying how long the hold can last, in
seconds.

<!-- binding: hold -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/match.md).*

A server ends the hold with `Resumed`, either
at once or after a countdown the client shows, during which input stays
locked; a client announces in chat who resumed it.

## The end

A server ends the match with `GameEnded`, saying which side won, and takes the
interface down with `HudDisabled`. A client shows the win or loss for its player's
side and sends `ClientFinished` once, except while playing a replay.

<!-- binding: end -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/match.md).*

`VictoryDance` sets every unit moving as winners or losers do. It ends nothing.

## Leaving and coming back

A client leaving as one abandoning the match sends `Exit`: as its player quits
or closes the window, as a reconnection fails, or on a server's `Shutdown`, which has it leave at once. A client also
leaves at once on `BotKick` with the action that means leave, which each range
names.

<!-- binding: bot-kick -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/match.md), [4.20](bindings/4-20-0-315/match.md).*

A server tells the others that a player's client dropped with
`PlayerDisconnected`.

<!-- binding: disconnected -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/match.md).*

A client dropped during play connects again by itself, registers again, and sends
`ReconnectedInMatch` right after the registration answer; one dropped while
loading leaves instead. `SoftReconnect` rebuilds a client's world without a new connection, as
[Objects and identifiers](objects.md) describes.

## Messages

<!-- messages:begin -->

| Message                                                            | Sent by | Ranges          | What it does                                                                                                                                                                   |
| ------------------------------------------------------------------ | ------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`BotKick`](../schema/messages/BotKick.json)                       | server  | 4.10–4.17, 4.20 | Have a client it takes for a program rather than a player leave the match                                                                                                      |
| [`ClientFinished`](../schema/messages/ClientFinished.json)         | client  | 4.10–4.20       | What a client sends when it has finished with the match                                                                                                                        |
| [`ClockConvergence`](../schema/messages/ClockConvergence.json)     | server  | 4.10–4.20       | What a server sends about how its clock and a client's are being brought together                                                                                              |
| [`ClockReply`](../schema/messages/ClockReply.json)                 | client  | every range     | What a client sends back when a server states the match clock, carrying both readings so the server can tell how far apart they are                                            |
| [`ClockSync`](../schema/messages/ClockSync.json)                   | server  | every range     | Set a client's idea of how long the match has run                                                                                                                              |
| [`Empty`](../schema/messages/Empty.json)                           | server  | 4.10–4.20       | A message with no body                                                                                                                                                         |
| [`Exit`](../schema/messages/Exit.json)                             | client  | 4.10–4.20       | What a client sends as it leaves                                                                                                                                               |
| [`GameEnded`](../schema/messages/GameEnded.json)                   | server  | 4.10–4.20       | End the match and say which side won                                                                                                                                           |
| [`GameSpeed`](../schema/messages/GameSpeed.json)                   | server  | 4.10–4.20       | Set how fast the game's clock runs                                                                                                                                             |
| [`HudDisabled`](../schema/messages/HudDisabled.json)               | server  | 4.10–4.20       | Take down a client's interface as the match ends                                                                                                                               |
| [`Pause`](../schema/messages/Pause.json)                           | client  | 4.10–4.20       | Hold a match                                                                                                                                                                   |
| [`Paused`](../schema/messages/Paused.json)                         | server  | 4.10–4.20       | Put the match on hold                                                                                                                                                          |
| [`PlayerDisconnected`](../schema/messages/PlayerDisconnected.json) | server  | 4.10–4.20       | What a server sends as a player's client drops out                                                                                                                             |
| [`Reconnected`](../schema/messages/Reconnected.json)               | server  | 4.10–4.20       | Say a client has reconnected                                                                                                                                                   |
| [`ReconnectedInMatch`](../schema/messages/ReconnectedInMatch.json) | client  | 4.10–4.20       | What a client sends once it has connected again to a match it was playing, right after the server answers its registration                                                     |
| [`Resume`](../schema/messages/Resume.json)                         | client  | 4.10–4.20       | Start a paused match again                                                                                                                                                     |
| [`Resumed`](../schema/messages/Resumed.json)                       | server  | 4.10–4.20       | Take the match off hold                                                                                                                                                        |
| [`Shutdown`](../schema/messages/Shutdown.json)                     | server  | 4.10–4.20       | Have a client leave the match at once, as one abandoning it, sending Exit as it goes                                                                                           |
| [`SoftReconnect`](../schema/messages/SoftReconnect.json)           | server  | 4.10–4.17, 4.20 | What a server sends, in pairs, to rebuild a client's world without a new connection: the first marks what the client holds, the second deletes whatever is still marked        |
| [`StatTick`](../schema/messages/StatTick.json)                     | server  | 4.10–4.20       | Advance every unit's stats by a span of time                                                                                                                                   |
| [`Unhandled286`](../schema/messages/Unhandled286.json)             | server  | 4.10–4.20       | A message that changes nothing a client shows                                                                                                                                  |
| [`VictoryDance`](../schema/messages/VictoryDance.json)             | server  | 4.10–4.20       | Set every unit on a side moving as winners or losers do: a winning champion dances, a losing one stands idle, and other units play a win or loss animation where they have one |

<!-- messages:end -->
