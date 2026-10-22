# Transport

A server and a client exchange messages over UDP, carried by ENet 1.2.5 with
the header each range's definitions give.

## Layering

Four layers carry a message to a socket.

1. UDP moves datagrams.
2. ENet turns datagrams into ordered, acknowledged deliveries on numbered
   channels.
3. A cipher covers each channel payload.
4. A message occupies the deciphered payload, opening with the header its
   family carries.

Layers 1 and 2 are the transport, and this document covers them. The cipher and
everything above it belong to the protocol, and this document covers the cipher
because nothing above it can be read without one.

## Stock ENet

This document does not restate ENet. Connection setup, acknowledgement,
sequence numbers, retransmission, throttling, and fragmentation behave as
[ENet 1.2.5](http://enet.bespin.org) defines them. ENet is published as a C
library with reference documentation rather than as a written protocol, so
that library is what defines this behaviour.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0**
>
> Stock ENet 1.2.5 serves a client as it stands: the header, the constants and
> the commands are the release's own. A client abandons a connection whose
> verify connect states another channel count, or other throttle values, than its
> connect asked for, and stock ENet states the client's own.

<!-- holds from 3.02.0.30 up to 3.03.0.198 -->

> **In 3.02**
>
> Stock ENet 1.2.5 serves a client with one change: a client takes no datagram
> larger than 996 bytes, so a server MUST NOT send one. The header and the
> commands are the release's own. A client abandons a connection whose verify
> connect states another channel count, or other throttle values, than its
> connect asked for.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> The rest of this chapter says what a client does **not** accept from stock
> ENet. A server built on an unmodified ENet 1.2.5 never completes a connection.

## The packet header

`schema/protocol.json` gives the layout, one per version range. A server MUST
use the layout recorded for the version it serves, because a client establishes no
connection under any other layout.

The layout is the delta. Everything else about the transport is ENet, so a
header built from the schema is necessary to reach a client and not sufficient
on its own. Where a field's content is free rather than fixed, the note beside
it in the schema says so.

`conformance/vectors/transport` holds a header with a sent time and one
without.

A client discards any datagram shorter than the `minimumDatagram` constant of
its range. A server MUST NOT send a shorter datagram.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> ## The connect command
>
> A client's connect command takes ENet's layout, except that two of its fields
> carry one byte of meaning each. The peer id is the first of the two bytes ENet
> gives it, and the session id is the first of the four. The bytes after each
> carry nothing a server reads, and a client fills them with anything.
>
> A server MUST take the peer id and the session id from those first bytes. The
> session id is then the byte every header carries, and a server that reads
> either field at ENet's width answers a client that never hears it.
>
> A client asks for 8 channels. A server's verify connect MUST state that count,
> and the throttle interval, acceleration and deceleration the connect command
> carried: a client abandons a connection whose verify connect states anything
> else.

## Maximum transmission unit

A client asks for a transmission unit of 1400 bytes, and discards any datagram
whose UDP payload, packet header included, exceeds the
`maximumTransmissionUnit` constant of its range.

A server MUST accept a connection at a transmission unit no greater than that
constant, by clamping the value the client asks for. Capping its own sending
without clamping the negotiated value is not sufficient, because ENet derives
fragment sizes from the negotiated value and still emits datagrams above the
limit.

A server that does not clamp loses every message whose datagram exceeds the
constant, while the handshake, whose datagrams are small, still completes.

## The cipher

Whether a payload is enciphered follows from the state of the connection
rather than from the channel it travels on. A connection begins with no cipher
state, and the request that establishes it travels in the clear apart from one
field it carries enciphered as proof. Everything after that is enciphered, on
every channel and in both directions, the answer to that request included.

`schema/protocol.json` records which cipher, in which mode, and the shape of a
block. A standard implementation of Blowfish interoperates with a client.

Blowfish is an old algorithm, and a library that still carries it does not
always offer it by default. OpenSSL 3.0 provides it only through a legacy provider
that stays off unless something enables it, so anything built on that version
reports the algorithm as unsupported until the provider is turned on.

`conformance/vectors/cipher` covers a whole block, a payload with a tail too
short to fill one, and a payload shorter than a block.

There is no padding. Trailing bytes that do not fill a block travel unchanged,
so a payload shorter than one block travels entirely in the clear.

A server MUST NOT substitute
another cipher, because a client accepts no other.

### The key

Both ends hold the key before a connection opens. Nothing on the wire
negotiates it, and no exchange derives it. A client receives it as a launch
argument, in base64.

Registration is what associates that key with a connection. The request
carries a field enciphered under the key while the rest of it
travels in the clear, and a server that deciphers that field and finds what it
expects has learned that the other end holds the key. Nothing is negotiated,
and nothing is derived: the exchange proves possession of something both ends
already had, and a server MUST refuse a connection whose proof does not match.

`schema/messages` records the exchange itself, as `Register` and `Registered`.

## What a message is

One deciphered channel payload. It opens with the header its family carries,
and [Messages](messages.md) defines how a message is recorded.

<!-- channels -->
