# Implementing a server

Work through the documents below in order. Each one builds on the ones before
it. The goal is that together they are enough to build a conforming server in
any language, without reading another one, and the reading order says how far
that has got.

Every definition states the client versions it applies to, and
`schema/protocol.json` is where the versions recorded so far are listed.

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
2. [Messages](spec/messages.md), which defines how a message is recorded, what
   a family puts in front of one, and how to read a file in `schema/messages`.
3. [Joining a match](spec/joining.md), which sets out what a client and a
   server exchange, and in what order, from registering until play begins.
4. [Movement](spec/movement.md), which covers the one thing a path needs that
   no layout carries: what its coordinates mean.
5. [Replication](spec/replication.md), which covers the same for the message a
   server sends most: what the values inside it are, which no layout reaches.

The transport is a delta on ENet 1.2.5, so building it means building on ENet
or a port of it. Above the transport, every channel a capture behind this
specification carries traffic on is recorded: registering, the requests a
client sends, the clock, what a server says happened, what changes about a
unit, chat, and the seats before play. What a message means is recorded where
the traffic settles it and marked where it does not.
