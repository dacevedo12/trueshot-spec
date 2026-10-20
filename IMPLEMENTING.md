# Implementing a server

Read the book for the season of the client you serve, front to back. `bun run
site` writes one for each season into `dist/site`, and `bun run site -- --pdf`
typesets them too. Each chapter builds on the ones before it. Together they are
meant to be enough to build a conforming server in any language, without
reading another one.

A book holds for every range of its season, except a passage headed with
ranges, which holds for those alone. Its appendices give every message with
each layout it has by range, each range's live checks, and how each range
differs from the one before it. [Versions](spec/versions.md) says how the
definitions and the chapters a book is made from state which builds a fact
holds for.

Check your work against [conformance/](conformance/) as you go, rather than at
the end. How you structure what you build is your business. The vectors are the
measure this repository provides of whether it is right.

Field layouts live in [schema/](schema/) and are machine readable. Prose never
restates them, so a layout cannot be recovered by reading prose.

If the specification does not answer something you need, do not fill the gap
with a guess and carry on. That is a defect worth reporting, and
[CONTRIBUTING.md](CONTRIBUTING.md) explains how.
