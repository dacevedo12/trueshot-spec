# trueshot-spec

A wire protocol specification for League of Legends game servers.

This repository describes the protocol a server must speak for a League of
Legends client to connect to it, load a match, and play. It exists so that the
protocol can be studied in the open, and so that anyone, human or machine, can
build a conforming server of their own, in any language, without reading
anybody else's.

Every definition in [schema/](schema/) states the client versions it applies
to, so a reader can always tell what a fact was established against. One client
is described. Where a later one differs, the difference is recorded as
another revision rather than by changing what is written here, and no document
describes one client by pointing at another.

Where the protocol rests on public general purpose software, this repository
records the delta and names what it rests on rather than restating it. The
transport is ENet, and [Transport](spec/transport.md) says which parts are
stock and which are not.

Getting a game server running is how a lot of people learned to program. The
specification is written for that reader. It states what happens on the wire,
and leaves every design decision to you.

## Start here

[IMPLEMENTING.md](IMPLEMENTING.md) carries the reading order. Each document
builds on the ones before it, so read it through once before writing code.

[conformance/](conformance/) is where the vectors live. Any implementation can
run them, in any language, to check itself against what has been recorded.

To change the specification itself rather than build from it, read
[CONTRIBUTING.md](CONTRIBUTING.md).

## What you will need

- A grasp of binary data: integers, endianness, fixed width fields, bitmasks.
- Familiarity with UDP, and with the idea of an unreliable transport.
- Enough JSON to read a file. The field layouts are machine readable, and
  [Messages](spec/messages.md) defines the vocabulary they are written in.
- A language you are comfortable in. Any language will do.

None of this has to be known in advance. The specification names what it uses,
and defines its terms before it relies on them.

## Licence

Everything here is released under [CC0 1.0](LICENSE), which places it in the
public domain as far as the law allows. Copy it, build on it, and do not ask.

## Notes

trueshot-spec is not affiliated with, endorsed by, or sponsored by Riot Games.
League of Legends, and all related assets, names, and lore, are the property of
Riot Games, Inc.

No game client and no game assets are distributed here.
