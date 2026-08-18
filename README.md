# trueshot-spec

A wire protocol specification for League of Legends game servers.

This repository describes the protocol a server must speak for a League of
Legends client to connect to it, load a match, and play. It exists so that the
protocol can be studied in the open, and so that anyone, human or machine, can
build a conforming server of their own, in any language, working from this
document alone.

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
- A language you are comfortable in. Any language will do.

None of this has to be known in advance. The specification names what it uses,
and defines its terms before it relies on them.

## Notes

trueshot-spec is not affiliated with, endorsed by, or sponsored by Riot Games.
League of Legends, and all related assets, names, and lore, are the property of
Riot Games, Inc.

No game client and no game assets are distributed here.
