# The match

<!-- place: speed -->

`GameSpeed` sets how fast a client's game clock runs (see
[Time](../../time.md)), from 0 to 10 times normal, and shows the new speed over
its champion; sent during a hold, it takes effect as the match resumes. A client
changes nothing it shows for `StatTick`.

<!-- place: hold-requests -->

A client names no one in `Pause` or `Resume`.

<!-- place: hold -->

A client begins a hold only where the time `Paused` carries is above zero and the
match is not already held, and shows a tournament's hold, crediting the seat that asked,
where the message says it is one.

<!-- place: end -->

A client that receives `GameEnded` while still loading leaves at once.

<!-- place: bot-kick -->

The action of `BotKick` that means leave is 4.

<!-- place: disconnected -->

A client shows a notice in chat for `PlayerDisconnected`.

<!-- place: reconnecting -->

`Reconnected` announces that another player came back. A client shows it for
an ally, or for anyone while it watches the match, and only notes it where it
names its own client.

<!-- place: timeouts -->

Before loading is done, a client waits 60 seconds for an acknowledgement rather
than 15. In play it sends nothing on its own to show it is still there: what it
sends answers what it is sent (`ClockReply`, `TransientAck`, `WaypointAck`) or
follows from its player. Its view report, `Camera`, goes out only as its view
moves at least 200 units, at most every tenth of a second, and never while its
view is locked.
