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
plus its allowance for how late the statement arrived. A client answers with
`ClockReply`, from which a server measures the round trip. A server can report
the round trip it measured with `ClockConvergence`.

<!-- holds from 0.8.13.26 up to 4.20.0.315 -->

> **In 0.8.13.26–4.19**
>
> A client takes the round trip `ClockConvergence` reports into its allowance
> for lateness.

<!-- holds from 0.8.13.26 up to 1.0.0.141 -->

> **In 0.8.13.26–1.0.0.140**
>
> Each `ClockConvergence` sets a client's allowance to 0.8 times what it was
> plus 0.1 times the round trip it reports.

<!-- holds from 1.0.0.96 up to 1.0.0.141 -->

> **In 1.0.0.96–1.0.0.140**
>
> The allowance starts at 0, and nothing but `ClockConvergence` changes it: a
> client that has had none takes `ClockSync` as it stands. A server SHOULD send
> `ClockConvergence`, or each `ClockSync` sets a client's clock behind by the
> time it took to arrive.

A server sends `ClockSync` with 0 as play begins (see
[Joining a match](joining.md)), and again whenever it means a client's clock to
catch up with its own.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client's match clock starts at 0 as the client finishes loading, and runs
> on the client's own timer from then; a `ClockSync` sets it wherever it
> stands.

<!-- holds from 0.9.25.24 up to 4.20.0.315 -->

> **In 0.9.25.24–4.19**
>
> A client's match clock does not run until the first `ClockSync` arrives, which
> sets it. After that it runs on the client's own timer, and a later
> `ClockSync` only corrects it, however long a server leaves between them.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> A client runs no clock but the match clock, whose pace `GameSpeed` sets, at
> whatever speed it gives; a hold sets the pace to 0 until play resumes. A
> server that runs a match at other than normal speed MUST send `GameSpeed`
> with that speed, or a client's match clock runs apart from its own.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A `GameSpeed` that arrives during a hold sets the match clock running again
> at once.

<!-- holds from 1.0.0.126 up to 1.0.0.141 -->

> **In 1.0.0.126–1.0.0.140**
>
> A `GameSpeed` that arrives during a hold takes effect as play resumes.

A client shows the match's time counted from the moment on the match clock at
which the match began.

<!-- holds from 0.8.13.26 up to 0.9.25.36 -->

> **In 0.8.13.26–0.9.25.35**
>
> A client takes that moment from its own match clock, once, as its game loop
> runs.

<!-- holds from 1.0.0.126 up to 1.0.0.141 -->

> **In 1.0.0.126–1.0.0.140**
>
> `MatchStarted` gives that moment. Until it arrives, a client takes the match
> clock's reading as its game loop runs, and a `MatchStarted` arriving later
> replaces it. While the match clock is before that moment, a client shows a
> negative time.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> `MatchStarted` gives that moment, and a client shows zero while the match
> clock is before it.

Moments on the match clock include:

- when a monster arrives (`CreateNeutral`'s `spawnAt`, where it carries one);
- when a prop's animation starts (`MapPropChanged`, where it carries one);
- when an assisting unit last dealt damage (`ClientEvent`);
- when a champion's passive comes off cooldown, where a client is told it (see
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
