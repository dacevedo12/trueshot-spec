// The packet header schema/protocol.json lays out for a build, and the address
// check a 4.20 header opens with.

import { decodeFields, encodeFields, hex } from "./codec.ts";
import type { Values } from "./codec.ts";
import type { Layouts } from "./schema.ts";

const SALT = Uint8Array.of(0x98, 0x2e, 0x3f, 0x3c);
const POLYNOMIAL = 0x04c11db7;

const TABLE = (() => {
  const table = new Uint32Array(256);
  for (let v = 0; v < 256; v += 1) {
    let r = v << 24;
    for (let k = 0; k < 8; k += 1)
      r = r & 0x8000_0000 ? (r << 1) ^ POLYNOMIAL : r << 1;
    table[v] = r >>> 0;
  }
  return table;
})();

// The "direct" form the field's note gives: each byte enters the low eight
// bits as the top eight leave and select the table entry.
function addressCheck(address: string, port: number): string {
  const octets = address.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)
  ) {
    throw new RangeError(`not an IPv4 address: ${address}`);
  }
  const input = Uint8Array.of(
    ...octets,
    port & 0xff,
    (port >> 8) & 0xff,
    ...SALT,
  );
  let register = 0xffff_ffff;
  for (const byte of input) {
    const top = register >>> 24;
    register = (((register << 8) | byte) ^ (TABLE[top] ?? 0)) >>> 0;
  }
  return (~register >>> 0).toString(16).padStart(8, "0");
}

interface Header {
  readonly sessionId: number;
  readonly peerId: number;
  readonly sentTime: number | null;
}

class Headers {
  readonly #layouts: Layouts;

  constructor(layouts: Layouts) {
    this.#layouts = layouts;
  }

  get #context() {
    return {
      structs: this.#layouts.structs,
      endian: this.#layouts.protocol.endian,
    };
  }

  // Values for every field the build's header lays out. A field this module
  // does not know by name is written as zero.
  encode(header: Header, to: { address: string; port: number }): Uint8Array {
    const values: Record<string, Values[string]> = {};
    for (const field of this.#layouts.protocol.transport.header) {
      switch (field.name) {
        case "addressCheck":
          values[field.name] = addressCheck(to.address, to.port);
          break;
        case "sessionId":
          values[field.name] = header.sessionId;
          break;
        case "peer":
          values[field.name] = {
            peerId: header.peerId,
            sentTimeFlag: header.sentTime === null ? 0 : 1,
          };
          break;
        case "sentTime":
          values[field.name] = header.sentTime;
          break;
        default:
          values[field.name] =
            field.type === "bytes" && typeof field.size === "number"
              ? "00".repeat(field.size)
              : 0;
      }
    }
    return encodeFields(
      this.#layouts.protocol.transport.header,
      values,
      this.#context,
    );
  }

  decode(bytes: Uint8Array): {
    header: Header;
    offset: number;
    values: Values;
  } {
    const read = decodeFields(
      this.#layouts.protocol.transport.header,
      bytes,
      0,
      this.#context,
    );
    const peer = read.values["peer"];
    const peerId =
      typeof peer === "object" && peer !== null && !Array.isArray(peer)
        ? Number((peer as Values)["peerId"])
        : 0;
    const sent = read.values["sentTime"];
    return {
      header: {
        sessionId: Number(read.values["sessionId"]),
        peerId,
        sentTime: sent === null || sent === undefined ? null : Number(sent),
      },
      offset: read.offset,
      values: read.values,
    };
  }
}

export { addressCheck, Headers, hex };
export type { Header };
