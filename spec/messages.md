# Messages

A message occupies one deciphered channel payload. The payload opens with the
header the message's family carries, and the body begins where that header
ends.

`schema/messages` holds one file per message identity, and each file records
one or more revisions. A revision carries the value identifying the message,
the channel it travels on, its direction, how the transport delivers it, and
the fields of its body.
This document defines the vocabulary those files are written in. It records no
layout of its own, so no message can be recovered by reading it.

## Families

Every channel carries one family of messages, and `schema/channels.json` says
which. A family fixes two things: the numbering its command values are drawn
from, and the header that precedes every body on it. `schema/families.json`
records both. Two channels of one family share a numbering, so a value
identifies at most one message across both, and the same value on channels of
different families is two unrelated messages.

What selects the header is the family, not the channel. A channel carrying a
family is how the two connect, and reading a payload against the wrong family
decodes something rather than failing.

A revision names the channel it travels on, and names any others in `alsoOn`.
Those channels carry the same family, so the command value means the same
message on each, and the body is byte for byte the one the revision records.
What changes between them is delivery: each entry states how the transport
carries the message there. A server MAY send such a message on any channel the
revision names, and what it gets is the delivery stated for that channel. A
client reads it the same way on every one of them, so a server MUST NOT vary
the body with the channel it chooses. Each channel a revision names carries a
vector that arrived on it.

## The command

A revision records the value that identifies it, and the family's header says
where that value sits on the wire. That value is not a field of the message: it
belongs to the header, along with anything else the family carries before a
body begins.

A family keeps some values of the leading byte for framing rather than for
messages where it needs them, and `schema/families.json` lists which. One such
value means the real identifier is wider than a byte and
travels elsewhere in the header, which is how a family numbers more messages
than a byte holds. A revision records the identifier either way, and never the
escape.

Direction narrows it further. One value serves two messages travelling
opposite ways within a family.

## A container of several messages

One value the game family keeps for framing introduces a container rather than
a message: a run of several messages gathered into one payload, which a reading
end unwraps and reads one by one as though each had arrived on its own. A
container carries no header, so nothing in `schema/messages` describes one, and
a reading end MUST NOT read the value that introduces it as a command.

No payload behind this specification is a container, so how the entries inside
one are framed is not recorded here: a layout no client has confirmed is a
guess whatever label it carries, and this document does not carry guesses. A
server MUST NOT send a container, because a reading end built from this
document cannot take one apart.

## Reading a body

A body begins where its family's header ends. Fields occupy it in the order
the revision lists them, each beginning where the one before it ended. A
revision never restates a field its family's header already carries, and never
takes a name from it. Nothing is aligned and nothing is padded between
fields. A field's size is fixed by its type, given as a literal, carried by an
earlier field, or one of the two words below.

Where a size or a count names an earlier field, it names one that has already
been read and one holding an unsigned integer. It names either a whole field or
one run of bits inside a field, and a run is written as the field name, a full
stop, and the run name. `remaining` and `terminated` are reserved words rather
than names, so no field carries either.

A field of a body names only fields of that body. A family's header is read
first, but it belongs to every message of the family rather than to this one,
so nothing in a body is sized or governed by it.

What counts as an earlier field depends on what encloses the field doing the
naming. An item of an array reaches the fields of the body around it. The
fields of a struct reach only each other, because a struct is defined once and
used wherever it occurs, so it cannot depend on what surrounds any one use.

`remaining` means every byte from where the field begins to the end of what
encloses it: the message body, or the byte length of the struct or array the
field sits inside. A field measured that way is the last one its enclosure
defines, because nothing inside that enclosure can follow it.

An enclosure that states a byte length is itself an ordinary field, and fields
follow it as usual. An enclosure that states none ends where the body ends, so
it is the last field too, and so is any struct whose own last field is one of
these.

A body ends where its last field ends. A payload can carry more than that, and
one does: a server's answer to a registration has been seen four bytes longer
than the record, and the client it reached went on talking for the rest of the
match. So a reading end MUST read the fields a revision lists and MUST take no
meaning from anything past them, and MUST NOT refuse a payload for carrying it.
A sender MUST write the fields and nothing after them, because a length beyond
the record says nothing that a reading end reads.

This is the one thing a vector cannot show. A vector is read to its end, so a
payload with bytes past the record is not one, and the rule above rests on the
client that accepted such a payload rather than on a recorded layout.

## Byte order

A revision of `schema/protocol.json` states the byte order that covers a
version range, and every multi byte field in that range is read that way. A
field that differs states its own order, which overrides the range.

Where a range states no order, no order has been established for it, and a
field in that range that would need one cannot be recorded until one is.

## The types

**Integers.** `u8` through `u64` and `i8` through `i64`, in two's complement.
`f32` and `f64` are IEEE 754 binary floating point.

**Bytes.** A run of bytes with no interpretation. Its size is fixed, named by
an earlier field, or `remaining`.

**Strings.** A run of bytes and an encoding, either `utf8` or `ascii`. A size
is a literal or the name of an earlier field. A string given one occupies that
many bytes whatever its content, and the zero bytes at its end are padding
rather than content, so they are dropped. A zero anywhere else belongs to the
text and stays. A string sized `terminated` ends at the first zero byte, that
byte belongs to the field, and it is the only one dropped. A string sized
`remaining` carries every byte to the end of its enclosure, zeros included. A
size counts bytes rather than characters.

**Arrays.** A run of one repeated shape. An array states either a count of
items or a size in bytes, and never both. A count is a literal, the name of an
earlier field, or `remaining`, which repeats to the end of the enclosure. A
size in bytes repeats until those bytes are consumed, which is how a run whose
length travels as a byte count is recorded.

**Structs.** A named group of fields, defined once in `schema/types` and used
wherever it occurs. A struct occupies exactly the bytes its own fields occupy.
Where its length travels on the wire instead, the field states a size in bytes,
as a literal or as the name of an earlier field, and the struct's fields MUST
fill it exactly.

**Bits.** A field of one or more bytes divided into named runs, whose widths
total exactly the bits those bytes hold. No run is wider than 32 bits. The
bytes are read as one little endian word whatever the range's byte order,
because the runs are positions in that word rather than fields of their own.
The runs are listed from the least significant bit upward: the first run
occupies the low bits, and each one after it the bits above. A run is read as
an unsigned integer of its own width.

**Bit arrays.** A run of the same group of bit runs, repeated a stated number
of times. The groups follow one another from the low bits of the first byte
upward, crossing byte boundaries without padding, and the field occupies as
many whole bytes as the groups need. The bits above the last group are clear. A
count is written as an array's is.

**Records.** A group of fields named together and read one after another, with
nothing between them and nothing around them. A record occupies exactly what
its fields occupy. Unlike a struct it is written where it is used rather than
defined in `schema/types`, and its fields reach the fields around it, so a
record is a way of naming part of a message rather than a shape reused
elsewhere.

## What a field names

A size, a count, or a rule about whether a field is present names an earlier
field. Four forms are written:

- a name on its own, which is a field of the same enclosure;
- a name, a full stop, and a run inside it, where that field is `bits`;
- a name, square brackets, and a name inside them, which is the item of an
  earlier array standing at the same position as the item doing the naming, so
  that two arrays run together;
- either of the first two inside `{"field": …, "minus": N}`, which is that
  field's value less the literal N. Nothing else is computed, and N is never
  larger than the value.

A rule about whether a field is present states a value the named field carries,
or a set of values, any one of which satisfies it. Without one, any
value other than zero satisfies the rule. A field its own rule left out holds
no value, so a rule naming that field does not hold either.

## A field that travels enciphered

A payload is enciphered as a whole once a connection has a cipher state, and a
message says nothing about that. One case is different: a payload that travels
before any cipher state exists can still carry a single field enciphered under
the key both ends hold, and a field states when it does.

Such a field occupies whole cipher blocks, because a field filling part of one
would travel half in the clear. Its recorded value is what the bytes mean once
deciphered, so a reader deciphers the field alone and leaves the payload around
it untouched.

## Presence

A field states a presence rule when it occupies bytes only under a condition.
The rule names an earlier field or bit run holding an integer, and where the
condition is a value rather than a flag, the value it takes. A field whose
condition does not hold occupies no bytes at all.

A rule states which side of it no captured payload shows, where a payload
shows only one. Such a rule is recorded from something other than a capture,
and the vectors hold it to that: a rule saying no payload is missing the field
fails the moment one is. A rule that says nothing carries a vector for each
side, which is what separates a rule somebody has confirmed from one somebody
has proposed.

## Enumerated values

Where a client treats an integer field, or a run of bits inside one, as a fixed
set, it records what the values mean, keyed by the value on the wire. Each
entry names the value, in the same form a field name takes, and no two entries
of one field share a name. A key fits the width and sign of what it names.
Recording some of a set does not claim to have recorded all of it, so a value
with no entry is a value nobody has identified rather than one the client
rejects.

## Revisions

A revision covers a range of client versions, from one version inclusive to
another exclusive. A range with no end runs as far as the specification itself
reaches, which is the last version a packet header covers, rather than forever:
nothing above the transport can be claimed for a version the transport does not
describe. Ranges of one message never overlap, so recording a revision that
starts later means stating where the one before it stops rather than leaving it
open.

A revision covers no version that `schema/protocol.json`, `schema/channels.json`
and `schema/families.json` do not all describe, because a range none of them
reaches has no header, no byte order, and no channel to travel on.

A revision travels on a channel, which `schema/channels.json` defines, and
names any further channels carrying the same layout, as Families above says. For
each it states how the transport delivers it: reliable, unreliable, or
unsequenced.
Every revision states this for itself. A channel's note records what its traffic
is observed to do, which is an observation rather than a default:
one channel carries all three, so there is nothing to inherit.

## Names and notes

A field name begins with a lower case letter and carries letters and digits
after it. A message identity and a struct identity begin with a capital. A file
is named for the identity it defines, and a message's vectors sit in one
directory named for that identity, with each capital starting a new part, lower
case and joined by hyphens.

A field name is unique among the fields beside it, and an item of an array
never takes the name of a field enclosing it.

Anything in `schema/` carries a note wherever a fact needs words: a revision, a
field, a run of bits, a value. A note records what a client does. It carries no
requirement keyword, because a requirement belongs here in `spec/` where a
reader looks for one, and it describes no moment in time, because a note that
says a thing changed leaves a reader guessing which version it changed in.

## How a message is delivered

A revision states whether the transport carries it reliably, unreliably, or
unsequenced. This is the one thing a revision states that no vector settles.
The captures behind this specification record a payload, the channel it went
on, and which way it travelled, and nothing in them carries a delivery flag, so
what is written is what the message needs of the transport rather than
something observed: a message another supersedes can be lost, and one that
carries an account of what happened cannot.

A reader building a server MUST take this as the one place to check its own
judgement against a running client, and MUST NOT read it as evidenced the way a
layout is.

## Directions

A revision states whether it travels `clientToServer`, `serverToClient`, or
`bidirectional`. Direction is part of what identifies a message, so one value
serves two messages travelling opposite ways within a family. A bidirectional
revision claims that value both ways.

## Identity a message reports about itself

A message that names a player names them with a value the sender chose. A
receiving client acts on that value, associating the message with a player and
applying whatever the viewer has set for them, and it does not check the value
against the connection the message arrived on.

A server MUST therefore set any field naming the sender from the connection the
message arrived on, and MUST NOT copy the value the message carried. Relaying
what arrived lets one player send messages that every other client attributes
to another.

## Values a layout cannot reach

A run of bytes is sometimes carried whose contents a layout cannot describe,
because reading them apart needs to know each value's width and kind and the
wire carries neither. Both ends hold that knowledge before a match begins, as
they hold the origin a path is measured against.

Such a run is recorded as the bytes it is, with a length beside it and a note
saying what settles the reading. A server relays or produces it whole. Nothing
here says what any of it means, so nothing here can be wrong about it.

How the values sit in the run is another matter, and that much is recorded. A
run holds its values one after another with nothing between them, in the order
whatever selects them names them, lowest first. Each value takes one of two
shapes.

A value that counts takes seven bits from each byte, lowest seven first, and
the top bit of a byte is set while another byte follows. Five bytes therefore
carry anything a thirty two bit value holds.

A value that measures takes one of three forms: a single byte of 255 meaning
zero; a byte of 254 followed by four bytes; or four bytes on their own. The
four bytes are the measure itself, lowest byte first.

Which of the three a value takes is settled by its own lowest byte, and a
reading end tells them apart by the first byte it meets. A value whose lowest
byte is 254 or 255 MUST carry the byte of 254 before it, and a value whose
lowest byte is anything else MUST NOT, so a measure written plain never begins
with either. That is what makes the first byte enough: 255 alone is zero, 254
says the four bytes after it are the measure, and anything else is already the
lowest byte of one. In every measure observed, plain and marked alike, this
holds without exception.

The single byte of 255 is one way to carry zero rather than the only one. A
measure of zero is observed written plain, as four bytes.

Reading a run therefore needs to know, for each value, which of the two shapes
it takes. Nothing on the wire says, and it is not settled by position alone, so
an end that does not already know cannot read one.

## What follows what

Most of what a client sends stands on its own: it moves, selects, marks the
map, buys and sells in whatever order a player acts, and a server refusing one
of those does not change what comes next.

Opening a connection is not like that. A client asks whether a server is ready
and asks again until told it is. It states its build only once told. It reports
a character settled the moment loading reaches its end, and reports itself
ready some while after that. Each waits on the step before it.

One thing during play behaves the same way. A client names each view report
and sends it again until a server returns that name, so a server that returns
nothing is sent the same report over and over.

## Vectors

Every revision carries at least one conformance vector, which is what separates
a layout somebody has confirmed against a client from one somebody has
proposed. A message vector opens with its family's header and is read to the
end, so a layout leaving bytes unread is a layout that is wrong.
[conformance/](../conformance/) says how a vector is written and how to run
one.
