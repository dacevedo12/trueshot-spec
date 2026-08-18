# Messages

A message occupies one deciphered channel payload. Its first byte names which
message it is, and the bytes after it are the message body.

`schema/messages` holds one file per message identity, and each file records
one or more revisions. A revision carries the command byte that names the
message, the channel it travels on, its direction, and the fields of its body.
This document defines the vocabulary those files are written in. It records no
layout of its own, so no message can be recovered by reading it.

## The command byte

The leading byte is not a field. A revision records it once, as its command,
and the field list begins at the byte after it. A server reads that byte to
decide which layout applies, and writes it ahead of the body it has encoded.

A command byte identifies a message only alongside its channel and direction.
The same value on two channels is two different messages.

## Reading a body

Fields occupy the body in the order the revision lists them, each beginning
where the one before it ended. Nothing is aligned and nothing is padded between
fields. A field's size is either fixed by its type, given as a literal, or
carried by an earlier field.

Where a size or a count names an earlier field, it names one that has already
been read. It names either a whole field or one run of bits inside a field, and a
run is written as the field name, a full stop, and the run name.

`remaining` means every byte from where the field begins to the end of the
body. A field measured that way is the last one a revision defines, because
nothing can follow it.

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

**Strings.** A run of bytes and an encoding, either `utf8` or `ascii`. A string
given a size occupies that many bytes whatever its content, the bytes after its
text are zero, and those zeros are padding rather than content. A string sized
`terminated` ends at the first zero byte, that byte belongs to the field, and
it is the only one dropped. A string sized `remaining` carries every byte to
the end of its enclosure, zeros included. A size counts bytes rather than
characters.

**Arrays.** A run of one repeated shape. An array states either a count of
items or a size in bytes, and never both. A count is a literal, the name of an
earlier field, or `remaining`, which repeats to the end of the body. A size in
bytes repeats until those bytes are consumed, which is how a run whose length
is carried as a byte count is recorded.

**Structs.** A named group of fields, defined once in `schema/types` and used
wherever it occurs. A struct occupies exactly the bytes its own fields occupy.
Where its length travels on the wire instead, the field states a size, and the
struct's fields MUST fill it exactly.

**Bits.** A field of one or more bytes divided into named runs, whose widths
total exactly the bits those bytes hold. No run is wider than 32 bits. The
bytes are
read as one little endian word whatever the range's byte order, because the
runs are positions in that word rather than fields of their own. The runs are
listed from the least significant bit upward: the first run occupies the low
bits, and each one after it the bits above. A run is read as an unsigned
integer of its own width.

## Presence

A field states a presence rule when it occupies bytes only under a condition.
The rule names an earlier field or bit run, and where the condition is a value
rather than a flag, the value it takes. A field whose condition does not hold occupies no
bytes at all.

## Enumerated values

Where a client treats an integer field as a fixed set, the field records what
the values mean, keyed by the value on the wire. Recording some of a set does not claim to
have recorded all of it, so a value with no entry is a value nobody has
identified rather than one the client rejects.

## Revisions

A revision covers a range of client versions, from one version inclusive to
another exclusive, and an open range runs to whatever the newest recorded
version turns out to be. Ranges of one message never overlap.

A revision travels on a channel, which `schema/channels.json` defines, and
takes that channel's reliability. Where the message differs, the revision
states its own.

## Vectors

Every revision carries at least one conformance vector, which is what
separates a layout somebody has confirmed against a client from one somebody
has proposed. [conformance/](../conformance/) says how a vector is written and
how to run one.
