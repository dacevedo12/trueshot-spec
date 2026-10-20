# Versions

Which client builds this specification covers, and how each part of it says
which builds a fact holds for.

## The ranges

A build is named the way its client reports it, in four parts. A range of
builds starts at a build and runs up to, not including, another, and is named
by its first two parts.

The ranges are not listed here, since the definitions make them: every build
at which a revision of any definition starts or stops begins a range, and the
range runs to the next such build. `bun run site` lists them, grouped by the
seasons in [seasons.json](seasons.json). A season runs from the first patch
of its ranked play up to the next season's first, so a preseason belongs to
the season it closes, and each season links the
[League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/Patch)'s list
of its patches.

Every build in a range is held to the same facts.

## Coverage

A range is checked against the client builds that
[conformance/live/results](../conformance/live/results/) holds a file for, one
per build, each naming the commit its checks ran at and how each fared. A range
claims the builds between its first and the last one whose checks all passed or
were skipped, and claims nothing of a build outside it.

## In the definitions

Every definition under `schema/` holds its facts in revisions, each naming the
range it applies to (see [Messages](messages.md)). Where ranges differ, each
has its own revision, and no revision is described by pointing at another. A
message a range lacks has no revision covering that range, and what a chapter
or a passage says about that message, or about a field or bit its revision for
the range lacks, says nothing of that range. A season's book lists, for each
range, the messages its chapters name and the range lacks.

## In the prose

A chapter under `spec/` holds for every range, except where a statement in it
names one. A statement such as "a 4.17 client" holds for that range alone and
says nothing of the others, and a 4.17 server is a server talking to a 4.17
client. A chapter that opens by naming ranges holds for those alone.

What some ranges alone do sits in the chapter where it concerns, as a
passage set apart: a quotation headed with the ranges it holds for, after a
comment naming its builds.

```markdown
<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client names no one in `Pause` or `Resume`.
```

A passage holds for every range from its first build up to, not including, the
second, and says nothing of the others. The heading is for a reader and the
comment for the tools: the checks hold the heading to the ranges the builds
cover, and `bun scripts/book.ts --fix` writes it again where ranges are renamed.
A statement in a passage holds for its ranges alone, so it names none. Where
several passages stand together, the one beginning first comes first, and of
two beginning together the wider.

## The books

`bun run site` writes `dist/site`: a home page, and a book for each season. A
book reads the chapters in the order [the index](README.md) gives them, with
each passage that holds for some of the season's ranges, headed with those,
and none of the others. Each system's chapter ends with its messages and the
command each takes by range. The appendices give every message and struct with
each layout it has in the season, and, for each patch, its builds, its notes and live checks, and how it differs
from the patch before it.
`bun run site -- --pdf` typesets each book as well, given
[pandoc](https://pandoc.org) and [typst](https://typst.app), and `bun run pages`
renders the home page and the books as web pages.
