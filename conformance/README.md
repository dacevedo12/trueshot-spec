# Conformance vectors

A vector is one recorded fact, written so a program can check itself against
it. Each is a JSON file holding an input, an output, and enough context to say
which part of the specification it belongs to.

The vectors are the measure of whether an implementation is right. Nothing here
says how to structure what you build, and nothing here is a test suite you are
expected to import. Read the files, feed them to your own code, and compare.

## Where they live

`vectors/` holds one directory per subject.

- `vectors/cipher` covers the cipher on its own, with no transport around it.
- `vectors/transport` covers the packet header.
- Message vectors live in a directory named for the message they carry.

Every file declares a `subject` saying which of the three it is, and a `note`
in plain words. `schema/meta/vector.json` is the machine readable definition of
the format, and it is the authority if this document and it disagree.

## The three shapes

A **cipher** vector carries `key`, `plaintext` and `ciphertext`, each a run of
lower case hexadecimal. Encipher the plaintext under the key and you get the
ciphertext. Decipher the ciphertext and you get the plaintext back. Length is
part of the fact: a plaintext whose tail does not fill a block travels with
that tail unchanged.

A **transport** vector carries `version`, `bytes` and `fields`. The bytes are a
packet header as it travels. The fields are what that header means, read
against the layout `schema/protocol.json` records for that version.

A **message** vector carries `message` as well, naming the message identity,
and its bytes are one deciphered channel payload rather than a header.

## Reading a vector's fields

`fields` writes each value the way JSON can hold it exactly.

| In the layout                       | In the vector                                 |
| ----------------------------------- | --------------------------------------------- |
| An integer under 64 bit             | a number                                      |
| A 64 bit integer                    | a decimal string, because JSON loses the tail |
| A run of bytes                      | lower case hexadecimal                        |
| A fixed size string                 | the text, with trailing zero bytes dropped    |
| An array                            | an array                                      |
| A struct or a bit run               | an object keyed by its own field names        |
| A field left out by a presence rule | `null`                                        |

Whitespace inside `bytes` groups the hexadecimal for reading and carries no
meaning. Strip it before decoding.

## Running them

Load the file, decode `bytes` against the layout for its version, and compare
what you get to `fields`. Then encode `fields` back and compare to `bytes`.
Both directions matter. An implementation that reads a header correctly and
writes it wrong fails only in the second.

For a cipher vector there are no layouts involved, so compare the two runs of
bytes directly.

## What the checks already guarantee

`npm run check` decodes every transport and message vector against the layout
it names, compares the result to its `fields`, encodes those fields back, and
compares to its `bytes`. Every cipher vector is enciphered and deciphered for
the same reason. A vector whose two halves disagree does not survive the
checks, so a vector here is evidence rather than an assertion.

That guarantee covers the vector against the schema. It does not cover the
schema against a client. Facts get into the schema by observation, and
[CONTRIBUTING.md](../CONTRIBUTING.md) says what counts as one.

## When a vector is wrong

If your implementation disagrees with a vector and you are confident you are
right, that is worth reporting rather than working around. A vector that does
not match a client is a defect of the same kind as a wrong field width.
