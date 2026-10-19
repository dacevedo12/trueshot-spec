# Versions

Which client builds this specification covers, and how each part of it says
which builds a fact holds for.

## The ranges

A build is named the way its client reports it, in four parts. A range of
builds starts at a build and runs up to, not including, another, and is named
by its first two parts.

<!-- ranges:begin -->

| Range                                | From       | Up to      |
| ------------------------------------ | ---------- | ---------- |
| [1.0](reference/1-0-0-126.md)        | 1.0.0.126  | 1.0.0.127  |
| [4.1](reference/4-1-0-171.md)        | 4.1.0.171  | 4.2.0.2726 |
| [4.2](reference/4-2-0-2726.md)       | 4.2.0.2726 | 4.3.0.495  |
| [4.3](reference/4-3-0-495.md)        | 4.3.0.495  | 4.4.0.1885 |
| [4.4](reference/4-4-0-1885.md)       | 4.4.0.1885 | 4.5.0.266  |
| [4.5](reference/4-5-0-266.md)        | 4.5.0.266  | 4.6.0.204  |
| [4.6](reference/4-6-0-204.md)        | 4.6.0.204  | 4.7.0.298  |
| [4.7](reference/4-7-0-298.md)        | 4.7.0.298  | 4.8.0.189  |
| [4.8](reference/4-8-0-189.md)        | 4.8.0.189  | 4.9.0.253  |
| [4.9](reference/4-9-0-253.md)        | 4.9.0.253  | 4.10.0.379 |
| [4.10](reference/4-10-0-379.md)      | 4.10.0.379 | 4.11.0.386 |
| [4.11](reference/4-11-0-386.md)      | 4.11.0.386 | 4.12.0.356 |
| [4.12](reference/4-12-0-356.md)      | 4.12.0.356 | 4.13.0.265 |
| [4.13](reference/4-13-0-265.md)      | 4.13.0.265 | 4.14.0.362 |
| [4.14](reference/4-14-0-362.md)      | 4.14.0.362 | 4.15.0.238 |
| [4.15](reference/4-15-0-238.md)      | 4.15.0.238 | 4.16.0.238 |
| [4.16](reference/4-16-0-238.md)      | 4.16.0.238 | 4.17.0.233 |
| [4.17](reference/4-17-0-233.md)      | 4.17.0.233 | 4.18.0.271 |
| [4.18–4.19](reference/4-18-0-271.md) | 4.18.0.271 | 4.20.0.315 |
| [4.20](reference/4-20-0-315.md)      | 4.20.0.315 | 4.21.0.0   |

<!-- ranges:end -->

Every build in a range is held to the same facts.

## Coverage

A range is checked against the client builds that
[conformance/live/results](../conformance/live/results/) holds a file for, one
per build, each naming the commit its checks ran at and how each fared. A range
claims the builds between its first and the last one checked as well, on the
strength of those checks, and claims nothing of a build outside it.

## In the definitions

Every definition under `schema/` holds its facts in revisions, each naming the
range it applies to (see [Messages](messages.md)). Where ranges differ, each
has its own revision, and no revision is described by pointing at another. A
message a range lacks has no revision covering that range, and what a chapter
says about that message says nothing of that range.

## In the prose

A chapter under `spec/` holds for every range, except where a statement in it
names one. A statement such as "a 4.17 client" holds for that range alone and
says nothing of the others, and a 4.17 server is a server talking to a 4.17
client. A chapter that opens by naming ranges holds for those alone.

What one range alone does belongs in that range's binding rather than in the
chapter. A binding is a directory under `spec/bindings`, named for the first
build of its range as the reference pages are, with a file for each chapter it
adds to. Each entry of such a file opens with a line naming a place the
chapter marks, and says what the range does there. A statement in a binding
holds for its range alone, so it names no range.

What several ranges do alike, and another does not, belongs in a binding for a
span: a directory named for two builds joined by `--`, which holds for every
range from the first build up to the second. Where a span and a range both
fill a place, the span's entry comes first.

## Books

`bun run book` writes one book for each range: the chapters in the order
[IMPLEMENTING.md](../IMPLEMENTING.md) reads them, the range's binding set in
its places, each system's table of messages with the commands the range uses,
and the range's reference page at the end. `bun run book -- --pdf` typesets
them as well, given [pandoc](https://pandoc.org) and [typst](https://typst.app).

## Per range

Each range in the table above links a page that lists every message a build in
it sends or takes, by system, with the layout of its body, generated from the
definitions. Each system document also ends with a generated table of its
messages, giving the ranges that define each.
