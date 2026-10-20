# Live checks

Checks the specification against a client you supply. Vectors say whether
an implementation reads and writes bytes as the specification records them;
these checks say whether a client agrees with the specification, by running
it.

A minimal server lives here, as much as a check needs: the codec, the steps
that bring one client into play, and the glue around stock parts for the rest.
The transport is ENet 1.2.5 through enet-js, built with the changes the
specification records, and the cipher is the runtime's own Blowfish. Every layout
it uses comes from `schema/`, so a check exercises the specification rather
than a copy of it. It is not a game server and not a reference to build one
from. The specification is that.

## What you need

- [Bun](https://bun.com) 1.4 or later.
- A C compiler and curl, to build ENet once.
- A client of a build the specification covers, and a way to run it on your
  system. Nothing here ships, fetches, or locates one.

## Running the checks

Every command runs from the repository root. The harness shares the codec,
cipher and definitions with the rest of the tooling, so `bun install` and
`bun run check` cover it without a client.

Build ENet, which a check against a client needs:

    bun run live:native

That fetches the ENet 1.2.5 release, checks it against a known digest,
applies `native/enet-1.2.5.patch`, and builds one library per header layout
into `native/build`: `libenet-plain` for a header that opens with the session
id, and `libenet-address-check` for one that opens with four bytes more. The
patch changes the header, the constants, and the connect command's two ids,
and nothing else. On Windows, build the same two from the patched release
and name them in `TRUESHOT_ENET_PLAIN` and `TRUESHOT_ENET_ADDRESS_CHECK`.

Then name a client in an environment file kept outside version control (every
`.env*` file here is ignored):

    TRUESHOT_BUILD=4.20.0.315
    TRUESHOT_CLIENT=/path/to/League of Legends.exe
    # Optional: a program the client is run through, given the client and its arguments.
    TRUESHOT_LAUNCHER=
    # Optional: a command run as the client is stopped, given the id of the process the
    # harness started.
    TRUESHOT_STOP=
    # Optional: a command given a file path, which captures the client's window to it,
    # or the window whose id follows the path.
    TRUESHOT_SCREENSHOT=
    # Optional: a command given the id of the process the harness started, which prints
    # the windows of that process and those under it, one per line as an id, a tab and
    # a title.
    TRUESHOT_WINDOWS=
    TRUESHOT_PORT=5000

and run every check against it:

    bun --env-file=<that file> run live:conform

A window the client opens besides the one it plays in, named by
`TRUESHOT_MAIN_WINDOW` (`League of Legends (TM) Client` unless set), is an
error it shows or its crash report. Where `TRUESHOT_WINDOWS` lists windows, the
harness captures any such window, notes its title, and ends the match there,
so a run stops at the error rather than at its timeouts.

That writes a results file named for the build, with its dots as hyphens
(`results/4-20-0-315.json`): the commit it ran at, each check's outcome,
and each screenshot a person has to judge, with the sentence it should bear
out. A results file is what a version range's coverage rests on, and anyone
holding the same build can run the same commit and compare.

`bun --env-file=<that file> run live:checks` runs the same checks without writing
results.

A build the specification does not cover yet can be tried against a range it
might belong to: `TRUESHOT_LAYOUTS` names the build whose layouts the harness
serves, and the client stays the one `TRUESHOT_BUILD` names. Such a run is a
trial, so `conform` writes it beside the captures rather than into `results/`.

The sweep check sends one payload of every message a server sends, from the
vectors, and asks that the client stays in play and gives the answers a client
owes. `TRUESHOT_SWEEP` narrows it to the messages it names, separated by
commas, `TRUESHOT_SWEEP_GAP` sets the milliseconds between them, and
`TRUESHOT_SWEEP_WAIT` how long the client is watched after the last, which
together find the message a client fails on. `TRUESHOT_SWEEP_SKIP` leaves out
the messages it names, for a trial whose client lacks what a vector names.

## How a client is started

The harness starts the client with three empty arguments, then one holding the
address, port, key in base64, and player id, separated by spaces:

    "League of Legends.exe" "" "" "" "127.0.0.1 5000 <key> 1"

The key is arbitrary.

## Serving a client started elsewhere

    bun run live:serve <build> [port]

serves one client of that build, launched some other way with the line above,
from connecting into play, and keeps it there until it leaves, recording a
capture as any run does.

## Captures and replays

Every run writes a directory under `captures/`, never committed: each message
both ways by name and fields, every datagram byte for byte, the client's
console output, and any screenshots. Screenshots stay there, because they show
the client's own art.

A capture can be run again:

    bun --env-file=<that file> run live:replay conformance/live/captures/<run> [seconds]

The match brings the client into play as usual, then sends what the check
sent on top, at the times it went out. Fields are encoded under the running
build's layouts, so a capture from one build replays on another that has the
same messages.

## Writing a check

A check is a `bun:test` file under `checks/`. It opens a `Match`, adds what it
is about through `spawn` (inside the spawn run) or `play` (once play begins),
and asserts on what the client sends back, through `session.next`. What only a
person can judge goes through `match.look`, with the sentence a screenshot
should bear out.

A check states what a client does, in the specification's terms, and relies on
nothing the specification does not record. Where a check needs something the
specification lacks, the specification is what changes.

## Layout

- `scripts/` at the root reads the definitions and lays out payloads, headers
  and the cipher, for this harness and for the checks alike.
- `src/enet.ts` is the transport, with a relay that records every datagram.
- `native/` builds ENet with the client's changes.
- `src/session.ts`, `src/match.ts` and `src/client.ts` run a match.
- `src/conform.ts` and `src/replay.ts` are the two commands above.
- `checks/` holds the checks.
