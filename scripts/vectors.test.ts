// Holds the harness's cipher, header and codec to every vector, both ways, so
// a check against a client starts from layouts already known to agree with the
// specification's own records.

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Blowfish } from "./cipher.ts";
import { decodeFields, encodeFields, unhex } from "./codec.ts";
import type { Values } from "./codec.ts";
import { addressCheck, Headers } from "./header.ts";
import { decodeMessage, encodeMessage } from "./message.ts";
import { Layouts } from "./schema.ts";

const VECTORS = join(import.meta.dir, "..", "conformance", "vectors");

interface Vector {
  readonly subject:
    "cipher" | "transport" | "message" | "struct" | "algorithm";
  readonly version?: string;
  readonly message?: string;
  readonly struct?: string;
  readonly channel?: string;
  readonly key?: string;
  readonly bytes?: string;
  readonly fields?: Values;
  readonly plaintext?: string;
  readonly ciphertext?: string;
}

const vectors: { readonly path: string; readonly vector: Vector }[] = [];
for (const dir of readdirSync(VECTORS)) {
  for (const file of readdirSync(join(VECTORS, dir))) {
    if (!file.endsWith(".json")) continue;
    const vector = JSON.parse(
      readFileSync(join(VECTORS, dir, file), "utf8"),
    ) as Vector;
    vectors.push({ path: `${dir}/${file}`, vector });
  }
}

const layouts = new Map<string, Layouts>();
const layoutsFor = (build: string): Layouts => {
  let found = layouts.get(build);
  if (found === undefined) {
    found = new Layouts(build);
    layouts.set(build, found);
  }
  return found;
};

const need = <T>(value: T | undefined, what: string): T => {
  if (value === undefined) throw new Error(`the vector carries no ${what}`);
  return value;
};

describe("cipher", () => {
  for (const { path, vector } of vectors.filter(
    (v) => v.vector.subject === "cipher",
  )) {
    test(path, () => {
      const cipher = new Blowfish(unhex(need(vector.key, "key")));
      const plain = unhex(need(vector.plaintext, "plaintext"));
      const enciphered = unhex(need(vector.ciphertext, "ciphertext"));
      expect(cipher.encipher(plain)).toEqual(enciphered);
      expect(cipher.decipher(enciphered)).toEqual(plain);
    });
  }
});

describe("transport", () => {
  test("the address check a 4.20 client writes", () => {
    expect(addressCheck("127.0.0.1", 5000)).toBe("2868bdeb");
    expect(addressCheck("127.0.0.1", 5001)).toBe("fa717c37");
  });
  for (const { path, vector } of vectors.filter(
    (v) => v.vector.subject === "transport",
  )) {
    test(path, () => {
      const l = layoutsFor(need(vector.version, "version"));
      const bytes = unhex(need(vector.bytes, "bytes"));
      const context = { structs: l.structs, endian: l.protocol.endian };
      const read = new Headers(l).decode(bytes);
      expect(read.values).toEqual(need(vector.fields, "fields"));
      const written = encodeFields(
        l.protocol.transport.header,
        need(vector.fields, "fields"),
        context,
      );
      expect(written).toEqual(bytes.subarray(0, read.offset));
    });
  }
});

describe("message", () => {
  for (const { path, vector } of vectors.filter(
    (v) => v.vector.subject === "message",
  )) {
    test(path, () => {
      const l = layoutsFor(need(vector.version, "version"));
      const name = need(vector.message, "message");
      const revision = l.message(name);
      const channel = l.channel(vector.channel ?? revision.channel);
      const bytes = unhex(need(vector.bytes, "bytes"));
      const cipher =
        vector.key === undefined ? undefined : new Blowfish(unhex(vector.key));
      const toServer = revision.direction !== "serverToClient";
      const read = decodeMessage(l, channel, bytes, toServer, cipher);
      expect(read.name).toBe(name);
      expect(read.fields).toEqual(need(vector.fields, "fields"));
      const written = encodeMessage(
        l,
        name,
        need(vector.fields, "fields"),
        cipher,
      );
      expect(written).toEqual(bytes.subarray(0, written.length));
    });
  }
});

describe("struct", () => {
  for (const { path, vector } of vectors.filter(
    (v) => v.vector.subject === "struct",
  )) {
    test(path, () => {
      const l = layoutsFor(need(vector.version, "version"));
      const fields = need(
        l.structs.get(need(vector.struct, "struct")),
        "definition",
      );
      const bytes = unhex(need(vector.bytes, "bytes"));
      const context = { structs: l.structs, endian: l.protocol.endian };
      const read = decodeFields(fields, bytes, 0, context);
      expect(read.offset).toBe(bytes.length);
      expect(read.values).toEqual(need(vector.fields, "fields"));
      expect(
        encodeFields(fields, need(vector.fields, "fields"), context),
      ).toEqual(bytes);
    });
  }
});
