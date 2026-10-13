# Versions

Which client builds this specification covers, and how each part of it says
which builds a fact holds for.

## The ranges

A build is named the way its client reports it, in four parts. A range of
builds starts at a build and runs up to, not including, another, and is named
by its first two parts.

| Range | From       | Up to    |
| ----- | ---------- | -------- |
| 4.17  | 4.17.0.233 | 4.18.0.0 |
| 4.20  | 4.20.0.315 | 4.21.0.0 |

Every build in a range is held to the same facts.

## In the definitions

Every definition under `schema/` holds its facts in revisions, each naming the
range it applies to (see [Messages](messages.md)). Where ranges differ, each
has its own revision, and no revision is described by pointing at another. A
message a range lacks has no revision covering that range.

## In the prose

Each document under `spec/`, other than this one, opens by naming the ranges it
applies to. A statement in it that names no range holds for every range the
document names. A statement that names one, such as "a 4.17 client", holds for
that range alone and says nothing of the others. A 4.17 server is a server
talking to a 4.17 client. Where ranges behave differently, the document says
what each does, in the same place.

## Per range

For each range, a page lists every message a build in it sends or takes, by
system, with the layout of its body, generated from the definitions:

- [4.17](reference/4-17-0-233.md)
- [4.20](reference/4-20-0-315.md)

Each system document also ends with a generated table of its messages, giving
the command and channel each takes in every range, or "none" where a range
lacks it.
