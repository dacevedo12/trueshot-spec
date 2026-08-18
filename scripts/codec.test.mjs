// The validator trusts the codec to say what a vector's bytes mean, so the
// codec is checked here against values worked out by hand. A round trip alone
// would not catch a fault that decode and encode share.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { CodecError, decodeFields, encodeFields } from "./codec.mjs";

const hex = (text) => Buffer.from(text.replace(/\s+/g, ""), "hex");

const roundTrip = (
  fields,
  bytes,
  values,
  { structs = new Map(), endian = "little" } = {},
) => {
  const buffer = hex(bytes);
  const read = decodeFields(fields, buffer, 0, structs, endian);
  assert.deepEqual(read.values, values);
  assert.equal(read.offset, buffer.length);
  assert.deepEqual(encodeFields(fields, values, structs, endian), buffer);
};

test("scalars little endian", () => {
  roundTrip(
    [
      { name: "a", type: "u8" },
      { name: "b", type: "u16" },
      { name: "c", type: "u32" },
      { name: "d", type: "i8" },
      { name: "e", type: "i16" },
      { name: "f", type: "i32" },
    ],
    "ff 0201 04030201 ff feff fcffffff",
    { a: 255, b: 258, c: 16909060, d: -1, e: -2, f: -4 },
  );
});

test("scalars big endian, and a field overriding the default", () => {
  roundTrip(
    [
      { name: "a", type: "u16" },
      { name: "b", type: "u32" },
    ],
    "0102 00000104",
    { a: 258, b: 260 },
    { endian: "big" },
  );
  roundTrip(
    [
      { name: "little", type: "u16" },
      { name: "big", type: "u16", endian: "big" },
    ],
    "0201 0102",
    { little: 258, big: 258 },
  );
});

test("sixty four bit integers travel as decimal strings", () => {
  roundTrip(
    [
      { name: "u", type: "u64" },
      { name: "i", type: "i64" },
    ],
    "ffffffffffffffff ffffffffffffffff",
    { u: "18446744073709551615", i: "-1" },
  );
});

test("floats", () => {
  roundTrip(
    [
      { name: "f", type: "f32" },
      { name: "d", type: "f64" },
    ],
    "0000803f 000000000000f03f",
    { f: 1, d: 1 },
  );
});

test("a byte run is lower case hexadecimal", () => {
  roundTrip([{ name: "raw", type: "bytes", size: 4 }], "deadbeef", {
    raw: "deadbeef",
  });
});

test("a fixed size string drops its trailing zero bytes", () => {
  roundTrip(
    [{ name: "name", type: "string", encoding: "utf8", size: 8 }],
    "48690000 00000000",
    {
      name: "Hi",
    },
  );
});

test("a sized string reads its size from another field", () => {
  roundTrip(
    [
      { name: "length", type: "u16" },
      { name: "text", type: "string", encoding: "utf8", size: "length" },
    ],
    "0300 596f75",
    { length: 3, text: "You" },
  );
});

test("a remaining string takes the rest of the payload", () => {
  roundTrip(
    [
      { name: "kind", type: "u8" },
      { name: "text", type: "string", encoding: "utf8", size: "remaining" },
    ],
    "01 4869",
    { kind: 1, text: "Hi" },
  );
});

test("bits pack from the least significant end", () => {
  roundTrip(
    [
      {
        name: "flags",
        type: "bits",
        size: 1,
        bits: [
          { name: "low", width: 7 },
          { name: "high", width: 1 },
        ],
      },
    ],
    "ff",
    { flags: { low: 127, high: 1 } },
  );
  roundTrip(
    [
      {
        name: "flags",
        type: "bits",
        size: 1,
        bits: [
          { name: "low", width: 7 },
          { name: "high", width: 1 },
        ],
      },
    ],
    "29",
    { flags: { low: 41, high: 0 } },
  );
});

test("an array takes its count from another field", () => {
  roundTrip(
    [
      { name: "count", type: "u8" },
      {
        name: "values",
        type: "array",
        count: "count",
        items: { name: "v", type: "u16" },
      },
    ],
    "02 0100 0200",
    { count: 2, values: [1, 2] },
  );
});

test("a struct nests, and a field inside it can size a later one", () => {
  const structs = new Map([
    [
      "Entry",
      {
        struct: "Entry",
        fields: [
          { name: "length", type: "u16" },
          { name: "text", type: "string", encoding: "utf8", size: "length" },
        ],
      },
    ],
  ]);
  roundTrip(
    [
      { name: "count", type: "u8" },
      {
        name: "entries",
        type: "array",
        count: "count",
        items: { name: "e", type: "struct", struct: "Entry" },
      },
    ],
    "02 0200 4869 0300 596f75",
    {
      count: 2,
      entries: [
        { length: 2, text: "Hi" },
        { length: 3, text: "You" },
      ],
    },
    { structs },
  );
});

test("a presence rule leaves a field out, and it is written as null", () => {
  const fields = [
    {
      name: "peer",
      type: "bits",
      size: 1,
      bits: [
        { name: "id", width: 7 },
        { name: "flag", width: 1 },
      ],
    },
    {
      name: "when",
      type: "u16",
      endian: "big",
      present: { when: "peer.flag" },
    },
  ];
  roundTrip(fields, "a9 001c", { peer: { id: 41, flag: 1 }, when: 28 });
  roundTrip(fields, "29", { peer: { id: 41, flag: 0 }, when: null });
});

test("a presence rule can turn on an exact value", () => {
  const fields = [
    { name: "kind", type: "u8" },
    { name: "extra", type: "u8", present: { when: "kind", equals: 3 } },
  ];
  roundTrip(fields, "03 07", { kind: 3, extra: 7 });
  roundTrip(fields, "04", { kind: 4, extra: null });
});

test("a payload too short to hold a field is rejected", () => {
  assert.throws(
    () =>
      decodeFields(
        [{ name: "a", type: "u32" }],
        hex("0102"),
        0,
        new Map(),
        "little",
      ),
    CodecError,
  );
});

test("a value too wide for its field is rejected on encode", () => {
  assert.throws(
    () =>
      encodeFields(
        [{ name: "a", type: "u8" }],
        { a: 256 },
        new Map(),
        "little",
      ),
    CodecError,
  );
  assert.throws(
    () =>
      encodeFields(
        [
          {
            name: "f",
            type: "bits",
            size: 1,
            bits: [
              { name: "x", width: 3 },
              { name: "y", width: 5 },
            ],
          },
        ],
        { f: { x: 8, y: 0 } },
        new Map(),
        "little",
      ),
    CodecError,
  );
});

test("a count that disagrees with the array it labels is rejected on encode", () => {
  assert.throws(
    () =>
      encodeFields(
        [
          { name: "count", type: "u8" },
          {
            name: "values",
            type: "array",
            count: "count",
            items: { name: "v", type: "u8" },
          },
        ],
        { count: 5, values: [1, 2] },
        new Map(),
        "little",
      ),
    CodecError,
  );
});

test("an array bounded by a byte length rather than an item count", () => {
  const structs = new Map([
    [
      "Attr",
      {
        struct: "Attr",
        fields: [
          { name: "id", type: "u8" },
          { name: "value", type: "u16" },
        ],
      },
    ],
  ]);
  roundTrip(
    [
      { name: "length", type: "u8" },
      {
        name: "attrs",
        type: "array",
        size: "length",
        items: { name: "a", type: "struct", struct: "Attr" },
      },
      { name: "tail", type: "u8" },
    ],
    "06 01 0a00 02 0b00 ff",
    {
      length: 6,
      attrs: [
        { id: 1, value: 10 },
        { id: 2, value: 11 },
      ],
      tail: 255,
    },
    { structs },
  );
});

test("a struct bounded by a byte length has to fill it exactly", () => {
  const structs = new Map([
    ["Pair", { struct: "Pair", fields: [{ name: "a", type: "u16" }] }],
  ]);
  const fields = [
    { name: "length", type: "u8" },
    { name: "pair", type: "struct", struct: "Pair", size: "length" },
  ];
  roundTrip(fields, "02 0100", { length: 2, pair: { a: 1 } }, { structs });
  assert.throws(
    () => decodeFields(fields, hex("03 010000"), 0, structs, "little"),
    CodecError,
  );
});

test("an item that consumes no bytes is rejected rather than repeated for ever", () => {
  assert.throws(
    () =>
      decodeFields(
        [
          {
            name: "tail",
            type: "array",
            count: "remaining",
            items: { name: "e", type: "bytes", size: 0 },
          },
        ],
        hex("0102"),
        0,
        new Map(),
        "little",
      ),
    CodecError,
  );
});
