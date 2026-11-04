# Time

Which clocks a match runs on, and which of them each time on the wire is
measured against.

## How a time is carried

A time is in seconds, as a 32-bit float, unless its definition says otherwise.
A field is either a moment, read against a clock, or a duration, which starts
when the message arrives. Every definition says which.

Exceptions:

- `Paused` carries the time left in a hold as a whole number of seconds.
- A stream's chunk and key frame intervals (`StreamMetadata`) are in
  milliseconds.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> The time between two of a stream's records (`StreamRecord`) is in
> milliseconds.

<!-- holds from 4.18.0.271 up to 4.21.0.0 -->

> **In 4.18–4.20**
>
> `MapPropChanged` gives when its change begins in milliseconds of match time.

## The match clock

The match runs on a server's clock, which counts seconds from 0 as play begins.
`ClockSync` states where it stands, and a client sets its own clock to that,
allowing for how late the statement arrived. A client answers with
`ClockReply`, from which a server measures the round trip. A server can report
the round trip it measured with `ClockConvergence`.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client takes the round trip `ClockConvergence` reports into its allowance for lateness.

A server sends `ClockSync` with 0 as play begins (see
[Joining a match](joining.md)), and again whenever it means a client's clock to
catch up with its own.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client's match clock does not run until the first `ClockSync` arrives, which
> sets it. After that it runs on the client's own timer, and a later
> `ClockSync` only corrects it, however long a server leaves between them.

`MatchStarted` gives the moment on the match clock at which the match began. A
client counts the match's time, as it shows it, from that moment, and shows
zero while the match clock is before it.

Moments on the match clock include:

- when a monster arrives (`CreateNeutral`'s `spawnAt`, where it carries one);
- when a prop's animation starts (`MapPropChanged`, where it carries one);
- when an assisting unit last dealt damage (`ClientEvent`);
- when a champion's passive comes off cooldown (see
  [Replication](replication.md)).

A server MUST state each of these on the clock it sends in `ClockSync`.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> ## The game clock
>
> A client also runs a game clock of its own, whose pace `GameSpeed` sets,
> from 0 to 10 times normal, and which `ClockSync` does not set. How long a unit
> stays dead, how long an object lives, and how long a client waits before
> removing a dead unit (see [Objects and identifiers](objects.md)) run on it. A
> server that runs a match at other than normal speed MUST send `GameSpeed`
> with that speed, or those durations run apart from its own.

## A stream's clock

A watching client plays a stream against a clock of the stream's own, which
the stream's records set (see [Watching a match](spectating.md)).
