# Transport

A server and a client exchange messages over UDP, carried by a modified
ENet 1.2.5.

## Layering

Four layers carry a message to a socket.

1. UDP moves datagrams.
2. ENet turns datagrams into ordered, acknowledged deliveries on numbered
   channels.
3. A cipher covers each channel payload.
4. A message occupies the deciphered payload, its first byte naming which
   message it is.

Layers 1 and 2 are the transport, and this document covers them. The cipher and
everything above it belong to the protocol, and this document covers the cipher
because nothing above it can be read without one.

## Stock ENet

This document does not restate ENet. Connection setup, acknowledgement,
sequence numbers, retransmission, throttling, and fragmentation behave as
[ENet 1.2.5](http://enet.bespin.org) defines them. ENet is distributed as a C
library with reference documentation rather than as a written protocol, and an
implementer works from that library or from a port of it.

What follows is what a client does **not** accept from stock ENet. A server
built on an unmodified ENet 1.2.5 never completes a connection.

## The packet header

`schema/protocol.json` gives the layout, one per version range. A server MUST
use the layout recorded for the version it serves, because a header read at the
wrong shape misplaces every field after it and no connection is established.

The layout is the delta. Everything else about the transport is ENet, so a
header built from the schema is necessary to reach a client and not sufficient
on its own. Where a field's content is free rather than fixed, the note beside
it in the schema says so.

`conformance/vectors/transport` holds a header with a sent time and one
without.

## Maximum transmission unit

A server MUST accept a connection at a transmission unit no greater than 996
bytes, measured as the UDP payload with the packet header counted in, by
clamping the value the client asks for. Capping its own sending without
clamping the negotiated value is not sufficient, because ENet derives fragment
sizes from the negotiated value and still emits datagrams above the limit.

The reason is not that the client asks for 996. The client asks for 1400 and
cannot receive more than 996, because the same ceiling sizes its receive
buffer. Nothing on the client corrects this. ENet clamps a requested unit only
where a connection is accepted, so the whole responsibility rests on the
server.

### When the limit is too high

A server that accepts the requested 1400 sends datagrams the client discards on
arrival. A datagram of 996 bytes or fewer still fits, so the handshake
completes and the connection looks healthy for as long as the messages stay
small.

The symptom arrives with the first large message: packet loss climbing from
zero while round trip time stays flat. Loss that rises without any matching
rise in latency means datagrams are being discarded on arrival rather than lost
in transit, and an oversized unit is the reason.

## The cipher

Each channel carries either enciphered payloads or plain ones, and
`schema/channels.json` says which.

`schema/protocol.json` records which cipher, in which mode, and the shape of a
block. A stock library implementation of it interoperates, confirmed against a
client.

Blowfish is an old algorithm, and a library that still carries it does not
always offer it by default. OpenSSL 3.0 moved it into a legacy provider that
stays off unless something enables it, so anything built on that version
reports the algorithm as unsupported until the provider is turned on. Enabling
it is the answer. A hand written Blowfish is a source of silent mismatch, and
nothing about this protocol calls for one.

`conformance/vectors/cipher` holds a pair of vectors. One covers a whole block
and one covers a payload with a tail too short to fill one.

There is no padding. Trailing bytes that do not fill a block travel unchanged,
so a payload shorter than one block travels entirely in the clear.

Blowfish and ECB both carry well understood weaknesses. This document records
what the client does. It does not endorse the choice, and an implementer has no
latitude to substitute.

### The key

Both ends hold the key before a connection opens. Nothing on the wire
negotiates it, and no exchange derives it. A server obtains it alongside the
rest of its match configuration, and a client receives it as a launch argument
in base64.

The channel carrying key exchange is plain, because that exchange proves the
two ends already agree rather than establishing anything.

> [!NOTE]
> The exchange itself is not recorded yet. Until it is, only the plain channel
> can be implemented from this document.

## What a message is

One deciphered channel payload. Its first byte names the message, and
[Messages](messages.md) defines how the rest of it is recorded.
