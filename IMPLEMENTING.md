# Implementing a server

Work through the chapters in the order [spec/README.md](spec/README.md) gives
them. Each one builds on the ones before it. Together they are meant to be
enough to build a conforming server in any language, without reading another
one.

Every definition states the client versions it applies to, and every chapter
holds for all of them, with what one range alone does in that range's binding.
[Versions](spec/versions.md) says how to read both. `bun run site` puts the
chapters and one range's binding together as a single book for each range, and
writes what changed from one range to the next, which is the easiest way to
read the specification for one range.

Check your work against [conformance/](conformance/) as you go, rather than at
the end. How you structure what you build is your business. The vectors are the
measure this repository provides of whether it is right.

Field layouts live in [schema/](schema/) and are machine readable. Prose never
restates them, so a layout cannot be recovered by reading prose.

If the specification does not answer something you need, do not fill the gap
with a guess and carry on. That is a defect worth reporting, and
[CONTRIBUTING.md](CONTRIBUTING.md) explains how.
