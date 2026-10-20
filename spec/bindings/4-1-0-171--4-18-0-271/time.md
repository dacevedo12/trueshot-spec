# Time

<!-- place: prop-time -->

`MapPropChanged` gives when its change begins in seconds of match time.

<!-- place: convergence -->

A client takes the round trip `ClockConvergence` reports into its allowance for lateness.

<!-- place: game-clock -->

## The game clock

A client also runs a game clock of its own, whose pace `GameSpeed` sets,
from 0 to 10 times normal, and which `ClockSync` does not set. How long a unit
stays dead, how long an object lives, and how long a client waits before
removing a dead unit (see [Objects and identifiers](../../objects.md)) run on it. A
server that runs a match at other than normal speed MUST send `GameSpeed`
with that speed, or those durations run apart from its own.

<!-- place: clock-start -->

A client's game clock does not run until the first `ClockSync` arrives, which
sets it. After that it runs on the client's own timer, and a later
`ClockSync` only corrects it, however long a server leaves between them.
