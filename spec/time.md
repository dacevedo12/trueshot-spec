# Time

Which clocks a match runs on, and which of them each time on the wire is
measured against.

## Units

A time is in seconds, as a 32-bit float, unless its definition says otherwise.
A field is either a moment, read against a clock, or a duration, which starts
when the message arrives. Every definition says which.

The exceptions are few:

- `Paused` carries the time left in a hold as a whole number of seconds.
- A stream's chunk and key frame intervals (`StreamMetadata`), and the time
  between two of its records (`StreamRecord`), are in milliseconds.
- `MapPropChanged` gives when its change begins in the unit its range states.

<!-- binding: prop-time -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/time.md), [4.20](bindings/4-20-0-315/time.md).*

## The match clock

The match runs on a server's clock, which counts seconds from 0 as play begins.
`ClockSync` states where it stands, and a client sets its own clock to that,
allowing for how late the statement arrived. A client answers with
`ClockReply`, carrying what the server said and what its own clock read as the
statement arrived, so a server can measure the round trip. A server can report
the round trip it measured with `ClockConvergence`.

<!-- binding: convergence -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/time.md).*

A server sends `ClockSync` as play begins, with 0 (see
[Joining a match](joining.md)), and again whenever it means a client's clock to
catch up with its own.

`MatchStarted` gives the moment on the match clock at which the match began. A
client counts the match's time, as it shows it, from that moment, and shows
zero while the match clock is before it.

Moments on the match clock include:

- when a monster arrives (`CreateNeutral`'s `spawnAt`);
- when a prop's animation starts (`MapPropChanged`);
- when an assisting unit last dealt damage (`ClientEvent`);
- when a champion's passive comes off cooldown (see
  [Replication](replication.md)).

A server MUST state each of these on the clock it sends in `ClockSync`.

<!-- binding: game-clock -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/time.md).*

## A stream's clock

A watching client plays a stream against a clock of the stream's own, which
the stream's records set (see [Watching a match](spectating.md)).
