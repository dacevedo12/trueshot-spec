# The match

<!-- place: reconnecting -->

A client started again for a match in progress knows nothing of it, and joins
as at the start: a server takes it through [Joining a match](../../joining.md)
from registering to `StartGame`, with a spawn run that states the field as it
stands, and a `ClockSync`.

A client dropped during play connects again to the same address and port, and
shows its player that it is reconnecting until it is back. It registers again,
sends `ReconnectedInMatch` as the answer naming it arrives, and goes on where it
was: it asks for no status and no version, loads nothing, and keeps every
seat, name and identifier it held. A server answers with `SoftReconnect`'s
stage that marks, then a message creating each unit the client is to hold,
each of which replaces whatever the client held under its identifier, then the
stage that sweeps away whatever is still marked. A server MUST NOT send
`SpawnStart` to a client coming back this way: it returns the client to
spawning, from which only another `StartGame` brings it back into play.

A client the server drops with the reason that means its player was away
shows that, and does not connect again.

<!-- place: timeouts -->

Once loading is done, a client gives up on a connection where a reliable
message it sent goes unacknowledged for 15 seconds. Where it has heard nothing
for 5 seconds in play, it shows its player that it is trying to reconnect, and
clears the notice as soon as anything arrives.
