# Contributing

> [!IMPORTANT]
> This repository describes a protocol. It records facts about what travels on
> the wire, established by observing a client and reverse engineering what it
> sends. It reproduces no source code.

These are the house rules. They apply to every contributor, human or otherwise.
If you came here to build a server rather than to change the specification,
read [IMPLEMENTING.md](IMPLEMENTING.md) instead.

## Ways to contribute

Open an issue to report a gap, a contradiction, or behavior the client does not
accept. Open a pull request to change the specification. Both count, and an
issue that names a problem precisely is worth more than a guess at the fix.

## What the specification describes

Observable behavior on the wire, and nothing else. It never describes how to
build a server.

- Do not name a language, framework, library, or runtime API.
- Do not prescribe an architecture, a concurrency model, or a data structure.
- Do not describe internal server state unless a client can observe it.
- Do not record whether an implementation has built a thing yet.

The test: if a statement would constrain someone who chose Rust and an entity
component system, and no client can observe the difference, it does not belong
here.

## Where things go

A **message** is what this specification defines: an identity, its revisions,
and the fields each one carries. A **packet** is what the transport moves. The
two words are not interchangeable, so use each for its own thing.

Field order, sizes, and types live in `schema/`, and nowhere else. Prose never
restates a layout. Prose covers what the schema cannot express: sequencing,
state transitions, ordering guarantees, timing, error handling, and algorithms.

Requirement keywords follow RFC 2119 as updated by RFC 8174. `MUST`,
`MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, `SHALL`, `SHALL NOT`, `REQUIRED`,
`RECOMMENDED`, and `OPTIONAL`, in uppercase, are the only words that carry
requirement force. Write one requirement per statement, and name the actor.

Give the unit for every quantity, because the schema records a field's type but
never what it measures. Endianness belongs in `schema/protocol.json`, not in
prose.

## What gets written down

A definition enters `schema/` once a client has confirmed it. Not when it looks
right, and not when another project agrees.

Working something out is the start of the job. A conformance vector a client
accepts is the end of it, and until then the finding belongs in an issue rather
than in the specification. Anything else publishes a guess with a label on it,
which is what a specification exists to avoid.

A vector is one message and what it decodes to, which makes it two claims:
decoding the bytes produces the fields, and encoding the fields reproduces the
bytes exactly. An implementation passes only when both hold. `schema/vector.json`
gives the shape.

Where a layout is confirmed but a field's meaning is not, say so in a note.
Those are two claims, and one can be settled while the other stays open.

Write down what the wire carries. Never write down how a program is organised,
decomposed, named, or commented, and never carry a line of one across.

Do not record what another project does or fails to do. That describes their
code, not this protocol. State what the client accepts.

## What never gets committed

- A game asset, in any form.
- Anything that identifies a person: a display name, an account identifier, an
  address. This holds whether it is plain text or bytes inside a message.
- A recorded match. A recording is somebody's whole game, and its content
  differs every time. Take the message you need out of it and commit that.

A message lifted from a recording carries names and identifiers in its bytes.
Zero them, adjust the decoded fields to match, and say so in a note.

## Naming

Names that travel on the wire are part of the protocol. Champions, models,
abilities, maps, particles, and asset names must appear exactly as the client
expects them, wherever the schema, the data, or the prose needs them. No
substitute works.

Names that identify this project are a separate matter. It does not use Riot's
logo, fonts, or visual style, and it does not present itself as theirs.

What this repository contains is a description of a protocol, together with the
names a client needs in order to load its own files. It contains nothing else
from the game: no art, no audio, no models, no lore, and no links to a client.

## Versions

The protocol changes between client versions. A message has one stable identity
and one or more revisions, each declaring the client version range it applies
to. A restructuring is a new revision, not a pile of conditionals. Never write
"in this version" in prose.

## Checks

`npm run check` runs file naming, formatting, schema validation, prose linting,
and link checking. Continuous integration runs the same checks, so a local pass
is a remote pass.

Prose and link checking need [Vale](https://vale.sh) and
[lychee](https://lychee.cli.rs) on your PATH. Everything else arrives with
`npm install`, which also installs a commit hook.

Commit messages and the sign-off trailer are checked by that hook, and again on
pull requests for anyone who has not installed it. A pull request is reviewed
once the checks pass, and not before.

Sign off your commits with `git commit -s`. That certifies the Developer
Certificate of Origin, and that you have followed the requirements on this
page.
