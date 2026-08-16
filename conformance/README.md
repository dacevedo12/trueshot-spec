# Conformance

A vector is one packet and what it decodes to.

```json
{
  "message": "Example",
  "version": "0.0.0.0",
  "bytes": "2a 01 00 00 00",
  "fields": { "command": 42, "playerId": 1 }
}
```

`bytes` is the complete channel payload, hexadecimal, whitespace ignored.
`fields` is the decoded value of every field the revision defines. A byte run
is written as hexadecimal, and an unsigned 64 bit value as a decimal string,
because JSON cannot hold one exactly as a number.

The example above is illustrative. It describes no real message.

## Both directions

Every vector is two assertions, and an implementation passes only if both hold.

1. Decoding `bytes` produces `fields`.
2. Encoding `fields` produces `bytes`, exactly.

The second one is the reason a vector is worth having. A server writes far more
packets than it reads, and a layout that decodes correctly by accident will
still fail to encode.

## Where a vector comes from

A recorded match is the source. Read a packet out of one, decode it, and freeze
both halves into a file here.

The recording itself is never committed. It is a whole match, its content
differs every time, and it belongs to whoever recorded it. What gets committed
is the packet, which is the part that holds still.

Before committing, remove anything that identifies a person. A recorded match
carries summoner names and account identifiers. Zero those bytes, adjust
`fields` to match, and say so in `note`.

## Layout

```
conformance/vectors/<message-name>/<case>.json
```

One directory per message, named in kebab-case after it, so `key-check` holds the vectors for `KeyCheck`. One file per case. A message earns a second vector
when it has a second shape worth pinning: an empty array, a maximum length
string, a field that only appears in one revision.
