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

Install and check the harness itself, which needs no client:

    bun install
    bun run typecheck
    bun run test

Build ENet, which a check against a client needs:

    bun run native

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
    # Optional: a command run after the client is stopped, to clean up after the launcher.
    TRUESHOT_STOP=
    # Optional: a command given a file path, which captures the client's window to it.
    TRUESHOT_SCREENSHOT=
    TRUESHOT_PORT=5000

and run every check against it:

    bun --env-file=<that file> run conform

That writes a results file named for the build, as `spec/reference` names
one (`results/4-20-0-315.json`): the commit it ran at, each check's outcome,
and each screenshot a person has to judge, with the sentence it should bear
out. A results file is what a version range's coverage rests on, and anyone
holding the same build can run the same commit and compare.

`bun --env-file=<that file> run checks` runs the same checks without writing
results.

## How a client is started

The harness starts the client with three empty arguments, then one holding the
address, port, key in base64, and player id, separated by spaces:

    "League of Legends.exe" "" "" "" "127.0.0.1 5000 <key> 1"

The key is arbitrary. Where a client runs under a compatibility layer, point
`TRUESHOT_LAUNCHER` at whatever starts a Windows program there.

## Captures and replays

Every run writes a directory under `captures/`, never committed: each message
both ways by name and fields, every datagram byte for byte, the client's
console output, and any screenshots. Screenshots stay there, because they show
the client's own art.

A capture can be run again:

    bun --env-file=<that file> run replay captures/<run> [seconds]

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

- `src/schema.ts` reads the definitions for one build.
- `src/codec.ts` and `src/message.ts` read and write payloads.
- `src/blowfish.ts` is the cipher, from the runtime's OpenSSL.
- `src/header.ts` reads and writes the packet header, for the vectors.
- `src/enet.ts` is the transport, with a relay that records every datagram.
- `native/` builds ENet with the client's changes.
- `src/session.ts`, `src/match.ts` and `src/client.ts` run a match.
- `test/` holds the harness to every vector, with no client involved.
- `checks/` holds the checks that need one.
