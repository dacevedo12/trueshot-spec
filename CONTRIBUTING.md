# Contributing

> [!IMPORTANT]
> This repository describes a protocol. It records facts about what travels on
> the wire, established by observing what a client sends and how it responds to
> what it is sent. It reproduces no source code.

These are the house rules. They apply to every contributor, human or otherwise.
If you came here to build a server rather than to change the specification,
read [IMPLEMENTING.md](IMPLEMENTING.md) instead.

## Ways to contribute

Open an issue to report a gap, a contradiction, or behavior the client does not
accept. Open a pull request to change the specification. Both count, and an
issue that names a problem precisely is worth more than a guess at the fix.

## What the specification describes

Observable behavior on the wire, and nothing else. It says what a server sends
and how a client responds, and leaves how to structure the server that does it
to whoever builds one.

- Do not name a language, framework, library, or runtime API, with one
  exception below.
- Do not prescribe an architecture, a concurrency model, or a data structure.
- Do not describe internal server state unless a client can observe it.
- Do not record whether an implementation has built a thing yet.

The test: if a statement would constrain someone who chose Rust and an entity
component system, and no client can observe the difference, it does not belong
here.

The exception is to the first bullet. Where the protocol relies on something an
implementer will struggle to obtain, the obstacle is worth naming, along with
the software it shows up in, because a reader who hits it otherwise concludes
the specification is wrong. That records a fact about the world rather than a
design, and it holds whatever language somebody works in.

It stays an observation. Naming where a thing is hard to get is not the same as
recommending how to get it, and the exception covers the first and not the
second. No requirement keyword attaches to it.

Requirement keywords belong in `spec/` and nowhere else. A note in `schema/`
records what a client does, so a requirement in one is a second copy of
something the prose already says.

## How the specification reads

The specification prescribes. It states facts about the protocol, not
implementation details: what the wire carries, what a conforming server sends,
and what a client does in response. Every fact is confirmed against how a
client behaves when given certain inputs.

A statement about a client says what it sends, what it shows, and what it does
next. Where a field carries nothing either end acts on, say what a sending end
writes there, such as "Unused; a server writes zero".

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
never what it measures. The byte order of a field belongs in `schema/`, not in
prose. A rule about how the schema itself is read is different: how a run of
bits is packed, or how a size is measured, is part of the vocabulary and
belongs in `spec/messages.md`.

## What gets written down

A definition enters `schema/` once a client has confirmed it. Not when it looks
right, and not when another project agrees.

Working something out is the start of the job. A conformance vector a client
accepts is the end of it, and until then the finding belongs in an issue rather
than in the specification. Anything else publishes a guess with a label on it,
which is what a specification exists to avoid.

One exception is narrow. A presence rule can mark one of its sides as
unseen when no payload shows it, but only where the layout that side guards is
confirmed by a payload somewhere else. The rule then records that a confirmed
shape can appear in a place nothing has yet shown it, and its note says what
the unseen side rests on. A layout no payload has shown anywhere does not
qualify, however it is marked.

A vector is one recorded fact and what it produces. For a vector carrying
bytes that makes two claims: decoding them produces the fields, and encoding
the fields reproduces the bytes the layout covers. An implementation passes
only when both hold.

`schema/meta/` holds the meta-schemas saying what a definition may contain.
Everything beside them is the definitions themselves.

An algorithm turns fields a decoder has already read into what they mean. It is
written in `spec/` and, where a checker can run it, recorded as a vector under
`conformance/vectors/algorithm`. It never reads bytes. Where one seems to need
them, what it needs is a way of saying a layout, and that belongs in the
vocabulary rather than here.

Where a layout is confirmed but a field's meaning is not, say so in a note.
Those are two claims, and one can be settled while the other stays open.

Write down what the wire carries and what a client does with it, and nothing
else. State what the client accepts.

## What never gets committed

- A game asset, in any form.
- Anything that identifies a person: a display name, an account identifier, an
  address. This holds whether it is plain text or bytes inside a message.
- A recorded match. A recording is somebody's whole game, and its content
  differs every time. Take the message you need out of it and commit that.

A message lifted from a recording carries names and identifiers in its bytes.
Zero them, or write a plain stand-in over the run and zero the rest of it,
adjust the decoded fields to match, and say so in a note. Where a capture was
taken from a server configured with stand-in names to begin with, the note says
that instead.

Text a server's operator wrote, such as a message of the day, is theirs rather
than the protocol's. A vector carrying it gets the same treatment.

A channel payload is enciphered on the wire. Decipher it before it becomes a
vector, because a vector records what a message is, not what one connection's
key made of it.

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
to. A restructuring is a new revision, not a pile of conditionals.

A revision describes itself. It never describes itself by reference to another
revision, and never asserts a direction of change. Two ranges were observed;
what lies between or beyond them is unknown, and prose that says one thing came
before another claims more than anyone has established. This holds for the
notes carried in the schema as much as for the documents, and both are
checked. [Versions](spec/versions.md) says how a document states which builds a
fact holds for.

### Chapters and bindings

A chapter holds for every range, so a statement belongs in it only where every
range bears it out. What one range's client was seen to do goes in that range's
binding, at the place in the chapter it concerns, and a chapter marks a new
place with a `<!-- binding: name -->` line where a binding needs one. A fact
shown to hold for every range moves from the bindings into the chapter.

A new range is a new binding. Its definitions go in `schema/` as revisions of
their own, its facts go in `spec/bindings/<first build>/`, and every chapter
statement goes on holding only once the new range's client bears it out; one
that does not moves into the bindings of the ranges that do. Contributors to
different ranges work in different directories, and a change to a chapter is a
claim about every range at once.

### Adding a range

Work on a branch, since nothing below passes the checks until the end.

1. Start the definitions. For builds nothing covers yet, `bun run range copy
<model> <from> <until>` gives every definition a copy of the revision its
   model build has. Take the nearest covered build as the model, and run it
   again with the next nearest to fill in what the first lacks: Season 3, for
   instance, copies from 4.1.0.171 and then from 1.0.0.126. For builds inside
   a range already covered, `bun run range split <build>` splits every
   revision there in two.
2. Correct each copy against a client of the new builds, and remove the
   revisions of messages those builds do not have. Where a copy turns out the
   same as its neighbour in every respect, join the two into one revision
   that covers both: the checks reject two revisions back to back that say the
   same thing.
3. Give every new revision a vector from the new builds, named for the range
   it starts, as [conformance/](conformance/README.md) says. No vector is
   copied, since a vector is evidence of the builds it names, so `bun run
check` lists every revision still waiting for one. Once the definitions
   cover the new builds, the live harness runs on them too and writes their
   results.
4. Move the prose. A fact the new range bears out in a span binding
   widens the span: rename its directory to start or stop where the new range
   does. One it does not bear out stays where it is, and what the new range
   does there goes in a binding of its own. A chapter statement it does not
   bear out moves into the bindings of the ranges that do.
5. Review what the tools list: every copied note that names a build, and every
   binding a split leaves behind. `bun run site` shows the new range against
   its neighbours, where anything left as a copy stands out.

A range's season comes from [spec/seasons.json](spec/seasons.json): the
season its first build falls in, a preseason counting as part of the season it
closes. The boundaries are not moved to suit a range.

## Systems

Every message names the system it belongs to, and each system has a document in
`spec/` that explains how its messages work together. Prose there describes
behaviour and links the definitions; it never restates a layout. Nothing
committed is generated from the definitions: the tables of a system's messages,
the page of every message in a range and what changes between ranges are all
written by `bun run site` into `dist/site`, so they cannot fall behind what
they are drawn from. A system's chapter marks where its book sets the table of
its messages with a `<!-- messages -->` line.

## Checks

The tooling runs on [Bun](https://bun.com), in TypeScript. `bun run check` runs
file naming, formatting, type checking, codec tests, schema validation, a check
that every binding has its place, prose linting, and link checking.
Continuous integration runs the same checks, so a local pass is a remote pass.

Schema validation decodes every vector rather than taking its word. A vector
whose bytes and fields disagree fails the checks, which is what makes a vector
evidence. Cipher vectors are run through Blowfish for the same reason.

Prose and link checking need [Vale](https://vale.sh) and
[lychee](https://lychee.cli.rs) on your PATH. Everything else arrives with
`bun install`, which also installs a commit hook. `nix develop` gives a shell
with Bun, Vale, lychee, pandoc and typst at the versions `flake.lock` pins,
which is what continuous integration runs in; it is a convenience, and the
same tools installed any other way serve as well.

[conformance/live](conformance/live/) checks the specification against a client
you supply, and is where a fact about a client is shown to hold for a build.

A pull request is reviewed once the checks pass, and not before.

## Commit messages

Every commit message takes this shape:

```
type(scope): what the commit does

Why it was needed, and anything a reader of the history would otherwise have
to reconstruct from the diff.

Signed-off-by: Your Name <you@example.com>
```

- The type is one of `feat`, `fix`, `docs`, `refactor`, `ci`, `chore` and
  `build`. A definition or document that gains a fact is `feat`; a fact
  corrected is `fix`; wording that changes no fact is `docs`.
- The scope, where one applies, is the part of the repository the commit
  changes: `schema`, `spec`, `conformance` or `tooling`.
- The title starts in lower case, has no closing full stop, and runs to 72
  characters at most. Message and field names keep their own case.
- The body is required, separated from the title by a blank line, and wrapped
  at 100 characters.
- The sign-off is required. Commit with `git commit -s`, which certifies the
  [Developer Certificate of Origin](DCO) and that you have followed the
  requirements on this page.

`commitlint.config.ts` holds the standard. The commit hook applies it as you
commit, and continuous integration applies it again to every commit pushed or
proposed.
