# Transport

A server and a client exchange messages over UDP, carried by a modified
ENet 1.2.5.

## Layering

Four layers sit between a socket and a message.

1. UDP moves datagrams.
2. ENet turns datagrams into ordered, acknowledged deliveries on numbered
   channels.
3. A cipher covers each channel payload.
4. A message occupies the deciphered payload, its first byte naming which
   message it is.

The cipher is the boundary between this document and the rest of the
specification. Everything below it is transport. Everything above it is the
protocol proper.

## Stock ENet

This document does not restate ENet. Connection setup, acknowledgement,
sequence numbers, retransmission, throttling, and fragmentation behave as
ENet 1.2.5 defines them, and an implementer works from that specification or
from any of its ports.

What follows is what a client does **not** accept from stock ENet. A server
built on an unmodified ENet 1.2.5 never completes a connection.

## The packet header

`schema/protocol.json` gives the layout. It replaces the stock header, and it
is the single change that makes stock ENet fail: every field after it lands at
the wrong offset.

The header occupies eight bytes when it carries a sent time, and six when it
does not. Bit 7 of the peer byte says which.

Three rules govern it.

1. A server MUST write four bytes at the start of every packet. A client
   rejects a packet without them.
2. A client does not read those four bytes. A server MAY write any value into
   them.
3. A server MUST copy the session identifier from the connect exchange into
   every packet it sends.

### When the session identifier is wrong

A client that receives a mismatched session identifier discards the packet. It
sends no error, closes nothing, and gives no sign that anything is wrong. It
continues sending its own packets and retransmitting the ones it never sees
acknowledged, at a delay that doubles each time.

A server whose session identifier is wrong therefore looks, from the outside,
like a server that has stopped responding. An implementer chasing that symptom
SHOULD check this field first.

## Byte order

The sent time in the packet header is big endian. Every field of every message
is little endian. The boundary between the two orders is the boundary between
the transport and the protocol above it.

## The cipher

Each channel carries either enciphered payloads or plain ones, and
`schema/channels.json` says which. The channel carrying key exchange is plain,
because no key has been agreed when it runs.

The cipher works on whole blocks and adds no padding. Bytes at the end of a
payload that do not fill a block travel unchanged, which means a payload
shorter than one block travels entirely in the clear. That is a consequence of
the block size rather than a rule of its own, and an implementer who treats it
as a special case for short payloads will get the same result.

## What a message is

One deciphered channel payload. Its first byte names the message, and
`schema/messages` gives the rest of the layout.
