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
   family carries, as [Messages](messages.md) defines.

This chapter covers layers 1 to 3.

## Stock ENet

This document does not restate ENet. Connection setup, acknowledgement,
sequence numbers, retransmission, throttling, and fragmentation behave as
[ENet 1.2.5](http://enet.bespin.org) defines them.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> Stock ENet 1.2.5 serves a client as it stands: the header, the constants and
> the commands are the release's own. A client abandons a connection whose
> verify connect states another channel count, or other throttle values, than its
> connect asked for, and stock ENet states the client's own.

<!-- holds from 3.02.0.30 up to 3.03.0.198 -->

> **In 3.02**
>
> Stock ENet 1.2.5 serves a client once its transmission unit is clamped (see
> below). The header and the commands are the release's own. A client abandons
> a connection whose verify connect states another channel count, or other
> throttle values, than its connect asked for.

<!-- holds from 3.03.0.198 up to 4.21.0.0 -->

> **In 3.03–4.20**
>
> The rest of this chapter says what a client does **not** accept from stock
> ENet. A server built on an unmodified ENet 1.2.5 never completes a connection.

## The packet header

`schema/protocol.json` gives the layout, one per version range. A server MUST
use the layout recorded for the version it serves, because a client establishes no
connection under any other layout.

A header built from the schema is necessary to reach a client, and not
sufficient on its own. Where a field's content is free rather than fixed, its
note in the schema says so.

`conformance/vectors/transport` holds a header with a sent time and one
without.

A client discards any datagram shorter than the `minimumDatagram` constant of
its range. A server MUST NOT send a shorter datagram.

<!-- holds from 3.03.0.198 up to 4.21.0.0 -->

> **In 3.03–4.20**
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
> A server's verify connect MUST state the channel count, and the throttle
> interval, acceleration and deceleration, the connect command carried: a
> client abandons a connection whose verify connect states anything else.

<!-- holds from 3.03.0.198 up to 3.13.0.399 -->

> **In 3.03–3.12**
>
> A client asks for 7 channels.

<!-- holds from 3.13.0.399 up to 4.21.0.0 -->

> **In 3.13–4.20**
>
> A client asks for 8 channels.

## Maximum transmission unit

A client asks for a transmission unit of 1400 bytes, and discards any datagram
whose UDP payload, packet header included, exceeds the
`maximumTransmissionUnit` constant of its range. A server MUST NOT send a larger
datagram.

<!-- holds from 1.0.0.127 up to 4.21.0.0 -->

> **In 1.0.0.127–4.20**
>
> That constant is below what a client asks for. A server MUST accept a
> connection at a transmission unit no greater than the constant, by clamping
> the value the client asks for. Capping its own sending without clamping the
> negotiated value is not sufficient, because ENet derives fragment sizes from
> the negotiated value and still emits datagrams above the limit.

## The cipher

Whether a payload is enciphered follows from the state of the connection
rather than from the channel it travels on. A connection begins with no cipher
state, and the request that establishes it travels in the clear apart from one
field it carries enciphered as proof. Everything after that is enciphered, on
every channel and in both directions, the answer to that request included.

`schema/protocol.json` records which cipher, in which mode, and the shape of a
block. A server MUST use that cipher; a client accepts no other. A standard
implementation of Blowfish interoperates with a client.

What a server sends carries no padding. Trailing bytes that do not fill a block
travel unchanged, so a payload shorter than one block travels in the clear.

<!-- holds from 0.8.13.26 up to 1.0.0.116 -->

> **In 0.8.13.26–1.0.0.114**
>
> A client pads what it sends to a whole number of blocks and enciphers all of
> it. The bytes it adds follow the message's own fields to the end of the
> payload and hold nothing in particular.

<!-- holds from 1.0.0.116 up to 4.21.0.0 -->

> **In 1.0.0.116–4.20**
>
> What a client sends carries no padding either.

`conformance/vectors/cipher` covers a whole block, a payload with a tail too
short to fill one, and a payload shorter than a block.

### The key

Both ends hold the key before a connection opens. Nothing on the wire
negotiates it, and no exchange derives it. A client receives it as a launch
argument.

<!-- holds from 0.8.13.26 up to 1.0.0.111 -->

> **In 0.8.13.26–1.0.0.110**
>
> A client decodes nothing: its key is the first sixteen characters of the
> argument, as they stand. A key both this and later builds take alike is
> sixteen characters of text.

<!-- holds from 1.0.0.111 up to 4.21.0.0 -->

> **In 1.0.0.111–4.20**
>
> The argument holds the key in base64.

Registration associates the key with a connection. `Register` travels in the
clear apart from one field enciphered under the key, and a server MUST refuse a
connection whose deciphered field is not what it expects. `schema/messages`
records the exchange, as `Register` and `Registered`.

<!-- channels -->
