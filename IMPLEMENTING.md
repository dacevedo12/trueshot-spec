# Implementing a server

Read the specification front to back before writing code: the chapters in
[spec/](spec/README.md), in the order its index gives them, or the book for the
season of the client you serve, which `bun run site` and `bun run pages` put
together from them, and which prints, or saves as a PDF, from its print
button. The two say the same thing; a book
keeps only what holds for its season. Each chapter builds on the ones before
it. Together they are meant to be enough to build a conforming server in any
language, without reading another one.

A chapter holds for every range, except a passage set apart and headed with
ranges, which holds for those alone. A book adds what the definitions give:
every message with each layout it has by range, and, for each patch, its live
checks and how it differs from the patch before it. [Versions](spec/versions.md)
says how the definitions and the chapters state which builds a fact holds for.

Check your work against [conformance/](conformance/) as you go, rather than at
the end. How you structure what you build is your business. The vectors are the
measure this repository provides of whether it is right.

Field layouts live in [schema/](schema/) and are machine readable. Prose never
restates them, so a layout cannot be recovered by reading prose.

If the specification does not answer something you need, do not fill the gap
with a guess and carry on. That is a defect worth reporting, and
[CONTRIBUTING.md](CONTRIBUTING.md) explains how.
