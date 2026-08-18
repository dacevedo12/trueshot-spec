# Implementing a server

Work through the documents below in order. Each one builds on the ones before
it. The goal is that together they are enough to build a conforming server in
any language, without reading another one, and the reading order says how far
that has got.

Check your work against [conformance/](conformance/) as you go, rather than at
the end. How you structure what you build is your business. The vectors are the
only measure of whether it is right.

Field layouts live in [schema/](schema/) and are machine readable. Prose never
restates them, so a layout cannot be recovered by reading prose.

If the specification does not answer something you need, do not fill the gap
with a guess and carry on. That is a defect worth reporting, and
[CONTRIBUTING.md](CONTRIBUTING.md) explains how.

## Reading order

1. [Transport](spec/transport.md), which carries everything else. Vectors for
   it live in `conformance/vectors/transport` and `conformance/vectors/cipher`.
2. [Messages](spec/messages.md), which defines how a message is recorded and
   how to read one of the files in `schema/messages`.

The transport is a delta on ENet 1.2.5, so building it means building on ENet
or a port of it. Above the transport the specification stops: the cipher is
named but its key exchange is not recorded, and no message is recorded, so a
server built from this repository speaks the transport and nothing above it.
