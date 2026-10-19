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
