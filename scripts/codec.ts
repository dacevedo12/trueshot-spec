// Reads and writes a run of fields as spec/messages.md defines them. Values take
// the shapes conformance/README.md gives a vector's fields, so a vector's
// `fields` can be handed to `encode` as it stands.

import type { Amount, BitRun, Endian, Field, Scalar } from "./schema.ts";

type Value =
  | number
  | string
  | null
  | readonly Value[]
  | { readonly [name: string]: Value };
type Values = { readonly [name: string]: Value };

interface Cipher {
  encipher(bytes: Uint8Array): Uint8Array;
  decipher(bytes: Uint8Array): Uint8Array;
}

interface Context {
  readonly structs: ReadonlyMap<string, readonly Field[]>;
  readonly endian: Endian;
  readonly cipher?: Cipher;
}

class CodecError extends Error {
  override readonly name = "CodecError";
}

const bail = (message: string): never => {
  throw new CodecError(message);
};

const WIDTH: Readonly<Record<Scalar, number>> = {
  u8: 1,
  i8: 1,
  u16: 2,
  i16: 2,
  u32: 4,
  i32: 4,
  u64: 8,
  i64: 8,
  f32: 4,
  f64: 8,
};

const isScalar = (type: string): type is Scalar => type in WIDTH;

const isRecord = (v: Value | undefined): v is Values =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function readScalar(
  view: DataView,
  at: number,
  type: Scalar,
  little: boolean,
): number | string {
  if (at + WIDTH[type] > view.byteLength)
    bail(`ran past the end reading ${type}`);
  switch (type) {
    case "u8":
      return view.getUint8(at);
    case "i8":
      return view.getInt8(at);
    case "u16":
      return view.getUint16(at, little);
    case "i16":
      return view.getInt16(at, little);
    case "u32":
      return view.getUint32(at, little);
    case "i32":
      return view.getInt32(at, little);
    case "u64":
      return view.getBigUint64(at, little).toString();
    case "i64":
      return view.getBigInt64(at, little).toString();
    case "f32":
      return view.getFloat32(at, little);
    case "f64":
      return view.getFloat64(at, little);
  }
}

function writeScalar(type: Scalar, value: Value, little: boolean): Uint8Array {
  const out = new Uint8Array(WIDTH[type]);
  const view = new DataView(out.buffer);
  if (type === "u64" || type === "i64") {
    if (typeof value !== "string" && typeof value !== "number")
      bail(`${type} is written as a decimal string, not ${typeof value}`);
    const big = BigInt(value as string | number);
    const fits =
      type === "u64"
        ? big >= 0n && big < 1n << 64n
        : big >= -(1n << 63n) && big < 1n << 63n;
    if (!fits) bail(`${String(value)} does not fit a ${type}`);
    if (type === "u64") view.setBigUint64(0, big, little);
    else view.setBigInt64(0, big, little);
    return out;
  }
  if (typeof value !== "number")
    return bail(`${type} is written as a number, not ${typeof value}`);
  const range: Partial<Record<Scalar, [number, number]>> = {
    u8: [0, 0xff],
    i8: [-0x80, 0x7f],
    u16: [0, 0xffff],
    i16: [-0x8000, 0x7fff],
    u32: [0, 0xffff_ffff],
    i32: [-0x8000_0000, 0x7fff_ffff],
  };
  const bounds = range[type];
  if (
    bounds !== undefined &&
    (!Number.isInteger(value) || value < bounds[0] || value > bounds[1])
  ) {
    bail(`${value} does not fit a ${type}`);
  }
  switch (type) {
    case "u8":
      view.setUint8(0, value);
      break;
    case "i8":
      view.setInt8(0, value);
      break;
    case "u16":
      view.setUint16(0, value, little);
      break;
    case "i16":
      view.setInt16(0, value, little);
      break;
    case "u32":
      view.setUint32(0, value, little);
      break;
    case "i32":
      view.setInt32(0, value, little);
      break;
    case "f32":
      view.setFloat32(0, value, little);
      break;
    case "f64":
      view.setFloat64(0, value, little);
      break;
  }
  return out;
}

// A reference names a field, a run of bits inside one, or the item of an
// earlier array at the position of the item doing the naming.
function lookup(scope: Values, path: string, index: number | null): Value {
  const item =
    /^([a-z][A-Za-z0-9]*)\[[a-z][A-Za-z0-9]*\](?:\.([a-z][A-Za-z0-9]*))?$/.exec(
      path,
    );
  if (item !== null) {
    const [, array = "", run] = item;
    const list = scope[array];
    if (index === null)
      return bail(`"${path}" names an item outside any item`);
    if (!Array.isArray(list))
      return bail(`"${array}" was not read before it was needed`);
    const one = (list as readonly Value[])[index];
    if (one === undefined) return bail(`"${array}" holds no item ${index}`);
    return run === undefined ? one : isRecord(one) ? (one[run] ?? null) : null;
  }
  const [head = "", run] = path.split(".");
  if (!(head in scope))
    return bail(`"${path}" was not read before it was needed`);
  const value = scope[head] ?? null;
  if (run === undefined) return value;
  return isRecord(value) ? (value[run] ?? null) : null;
}

function amount(spec: Amount, scope: Values, index: number | null): number {
  if (typeof spec === "number") return spec;
  const named = typeof spec === "string" ? spec : spec.field;
  const value = lookup(scope, named, index);
  if (value === null)
    return bail(
      `"${named}" is absent here, so it cannot say how much follows`,
    );
  const n = Number(value) - (typeof spec === "string" ? 0 : spec.minus);
  if (!Number.isInteger(n) || n < 0)
    return bail(`"${String(spec)}" is not a count`);
  return n;
}

function holds(field: Field, scope: Values, index: number | null): boolean {
  const rule = field.present;
  if (rule === undefined) return true;
  const value = lookup(scope, rule.when, index);
  if (value === null) return false;
  const n = Number(value);
  if (rule.equals === undefined) return n !== 0;
  return typeof rule.equals === "number"
    ? n === rule.equals
    : rule.equals.includes(n);
}

const widthOf = (bits: readonly BitRun[]): number =>
  bits.reduce((t, r) => t + r.width, 0);

const concat = (parts: readonly Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((t, p) => t + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};

const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString("hex");
const unhex = (text: string): Uint8Array =>
  Uint8Array.from(Buffer.from(text.replace(/\s+/g, ""), "hex"));

function decodeFields(
  fields: readonly Field[],
  bytes: Uint8Array,
  start: number,
  context: Context,
  outer: Values = {},
  index: number | null = null,
): { values: Values; offset: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const scope: Record<string, Value> = { ...outer };
  const values: Record<string, Value> = {};
  let offset = start;

  const need = (field: Field, length: number): void => {
    if (offset + length > bytes.length)
      bail(`"${field.name}" runs past the end`);
  };
  // A field that states its own length in bytes says how much it claimed.
  const claim = (field: Field, bound: number): void => {
    if (offset + bound > bytes.length)
      bail(`"${field.name}" claims ${bound} bytes and runs past the end`);
  };
  const decipher = (field: Field, raw: Uint8Array): Uint8Array => {
    if (context.cipher === undefined)
      return bail(`"${field.name}" travels enciphered, and no key was given`);
    return context.cipher.decipher(raw);
  };
  const items = (
    field: Field & { type: "array" },
    end: number,
    count: number | null,
  ): Value[] => {
    const out: Value[] = [];
    const bounded = bytes.subarray(0, end);
    while (count === null ? offset < end : out.length < count) {
      const read = decodeFields(
        [field.items],
        bounded,
        offset,
        context,
        scope,
        out.length,
      );
      if (count === null && read.offset === offset)
        bail(`"${field.name}" holds an item that consumes no bytes`);
      out.push(read.values[field.items.name] ?? null);
      offset = read.offset;
    }
    return out;
  };

  for (const field of fields) {
    const here =
      field.present?.when === "remaining"
        ? offset < bytes.length
        : holds(field, scope, index);
    if (!here) {
      values[field.name] = null;
      scope[field.name] = null;
      continue;
    }
    let value: Value;
    switch (field.type) {
      case "bytes": {
        const length =
          field.size === "remaining"
            ? bytes.length - offset
            : field.size === "terminated"
              ? bail("bytes cannot be terminated")
              : amount(field.size, scope, index);
        need(field, length);
        const raw = bytes.subarray(offset, offset + length);
        value = hex(field.enciphered === true ? decipher(field, raw) : raw);
        offset += length;
        break;
      }
      case "string": {
        let length: number;
        let keep: number;
        if (field.size === "remaining") {
          length = keep = bytes.length - offset;
        } else if (field.size === "terminated") {
          const end = bytes.indexOf(0, offset);
          if (end === -1) bail(`"${field.name}" has no terminator`);
          keep = end - offset;
          length = keep + 1;
        } else {
          length = amount(field.size, scope, index);
          need(field, length);
          keep = length;
          while (keep > 0 && bytes[offset + keep - 1] === 0) keep -= 1;
        }
        need(field, length);
        value = Buffer.from(bytes.subarray(offset, offset + keep)).toString(
          field.encoding === "ascii" ? "latin1" : "utf8",
        );
        offset += length;
        break;
      }
      case "array": {
        if (field.size !== undefined) {
          const bound = amount(field.size, scope, index);
          claim(field, bound);
          value = items(field, offset + bound, null);
        } else if (field.count === undefined || field.count === "remaining") {
          value = items(field, bytes.length, null);
        } else {
          value = items(
            field,
            bytes.length,
            amount(field.count, scope, index),
          );
        }
        break;
      }
      case "struct": {
        const definition =
          context.structs.get(field.struct) ??
          bail(`struct "${field.struct}" has no definition`);
        const bound =
          field.size === undefined ? null : amount(field.size, scope, index);
        if (bound !== null) claim(field, bound);
        const within =
          bound === null ? bytes : bytes.subarray(0, offset + bound);
        const read = decodeFields(definition, within, offset, context);
        if (bound !== null && read.offset !== offset + bound) {
          bail(
            `"${field.name}" is ${bound} bytes and its fields read ${read.offset - offset}`,
          );
        }
        value = read.values;
        offset = read.offset;
        break;
      }
      case "bitArray": {
        const groups =
          field.count === "remaining"
            ? bail("a bit array needs a count")
            : amount(field.count, scope, index);
        const length = Math.ceil((groups * widthOf(field.bits)) / 8);
        need(field, length);
        const out: Values[] = [];
        let bit = 0;
        for (let g = 0; g < groups; g += 1) {
          const one: Record<string, number> = {};
          for (const run of field.bits) {
            let v = 0;
            for (let k = 0; k < run.width; k += 1, bit += 1) {
              v |= (((bytes[offset + (bit >> 3)] ?? 0) >> (bit & 7)) & 1) << k;
            }
            one[run.name] = v >>> 0;
          }
          out.push(one);
        }
        value = out;
        offset += length;
        break;
      }
      case "record": {
        const read = decodeFields(
          field.fields,
          bytes,
          offset,
          context,
          scope,
          index,
        );
        value = read.values;
        offset = read.offset;
        break;
      }
      case "bits": {
        need(field, field.size);
        let word = 0n;
        for (let i = field.size - 1; i >= 0; i -= 1)
          word = (word << 8n) | BigInt(bytes[offset + i] ?? 0);
        const runs: Record<string, number> = {};
        let taken = 0n;
        for (const run of field.bits) {
          runs[run.name] = Number(
            (word >> taken) & ((1n << BigInt(run.width)) - 1n),
          );
          taken += BigInt(run.width);
        }
        value = runs;
        offset += field.size;
        break;
      }
      default: {
        const little = (field.endian ?? context.endian) === "little";
        const width = WIDTH[field.type];
        if (field.enciphered === true) {
          need(field, width);
          const clear = decipher(
            field,
            bytes.subarray(offset, offset + width),
          );
          value = readScalar(
            new DataView(clear.buffer, clear.byteOffset, clear.byteLength),
            0,
            field.type,
            little,
          );
        } else {
          value = readScalar(view, offset, field.type, little);
        }
        offset += width;
      }
    }
    values[field.name] = value;
    scope[field.name] = value;
  }
  return { values, offset };
}

function encodeFields(
  fields: readonly Field[],
  values: Values,
  context: Context,
  outer: Values = {},
  index: number | null = null,
): Uint8Array {
  const scope: Values = { ...outer, ...values };
  const parts: Uint8Array[] = [];
  const encipher = (field: Field, raw: Uint8Array): Uint8Array => {
    if (context.cipher === undefined)
      return bail(`"${field.name}" travels enciphered, and no key was given`);
    return context.cipher.encipher(raw);
  };

  for (const field of fields) {
    const given = values[field.name];
    if (field.present?.when === "remaining") {
      if (given === null || given === undefined) continue;
    } else if (!holds(field, scope, index)) continue;
    if (given === null || given === undefined)
      bail(`"${field.name}" is present but carries no value`);
    const value = given as Value;

    switch (field.type) {
      case "bytes": {
        if (typeof value !== "string")
          bail(`"${field.name}" is written as hexadecimal`);
        const raw = unhex(value as string);
        if (field.size !== "remaining" && field.size !== "terminated") {
          const size = amount(field.size, scope, index);
          if (raw.length !== size)
            bail(
              `"${field.name}" holds ${raw.length} bytes and its size says ${size}`,
            );
        }
        parts.push(field.enciphered === true ? encipher(field, raw) : raw);
        break;
      }
      case "string": {
        if (typeof value !== "string")
          bail(`"${field.name}" is written as text`);
        const text = Uint8Array.from(
          Buffer.from(
            value as string,
            field.encoding === "ascii" ? "latin1" : "utf8",
          ),
        );
        if (field.size === "remaining") parts.push(text);
        else if (field.size === "terminated")
          parts.push(concat([text, new Uint8Array(1)]));
        else {
          const size = amount(field.size, scope, index);
          if (text.length > size)
            bail(`"${field.name}" is longer than ${size} bytes`);
          parts.push(concat([text, new Uint8Array(size - text.length)]));
        }
        break;
      }
      case "array": {
        if (!Array.isArray(value))
          return bail(`"${field.name}" is written as an array`);
        const list = value as readonly Value[];
        if (
          field.size === undefined &&
          field.count !== undefined &&
          field.count !== "remaining"
        ) {
          const count = amount(field.count, scope, index);
          if (count !== list.length)
            bail(
              `"${field.name}" holds ${list.length} items and its count says ${count}`,
            );
        }
        const written = list.map((item, i) =>
          encodeFields(
            [field.items],
            { [field.items.name]: item },
            context,
            scope,
            i,
          ),
        );
        const body = concat(written);
        if (field.size !== undefined) {
          const bound = amount(field.size, scope, index);
          if (body.length !== bound)
            bail(
              `"${field.name}" writes ${body.length} bytes and its size says ${bound}`,
            );
        }
        parts.push(body);
        break;
      }
      case "struct": {
        const definition =
          context.structs.get(field.struct) ??
          bail(`struct "${field.struct}" has no definition`);
        if (!isRecord(value))
          return bail(`"${field.name}" is written as an object`);
        const written = encodeFields(definition, value, context);
        if (field.size !== undefined) {
          const bound = amount(field.size, scope, index);
          if (written.length !== bound)
            bail(
              `"${field.name}" writes ${written.length} bytes and its size says ${bound}`,
            );
        }
        parts.push(written);
        break;
      }
      case "bitArray": {
        if (!Array.isArray(value))
          return bail(`"${field.name}" is written as an array`);
        const groups = value as readonly Value[];
        const block = new Uint8Array(
          Math.ceil((groups.length * widthOf(field.bits)) / 8),
        );
        let bit = 0;
        for (const one of groups) {
          if (!isRecord(one))
            return bail(`"${field.name}" holds an item that is not an object`);
          for (const run of field.bits) {
            const v = Number(one[run.name] ?? 0);
            if (!Number.isInteger(v) || v < 0 || v >= 2 ** run.width)
              bail(`${v} does not fit the ${run.width} bits of "${run.name}"`);
            for (let k = 0; k < run.width; k += 1, bit += 1) {
              if (Math.floor(v / 2 ** k) % 2 === 1)
                block[bit >> 3] = (block[bit >> 3] ?? 0) | (1 << (bit & 7));
            }
          }
        }
        parts.push(block);
        break;
      }
      case "record": {
        if (!isRecord(value))
          return bail(`"${field.name}" is written as an object`);
        parts.push(encodeFields(field.fields, value, context, scope, index));
        break;
      }
      case "bits": {
        if (!isRecord(value))
          return bail(`"${field.name}" is written as an object`);
        let word = 0n;
        let taken = 0n;
        for (const run of field.bits) {
          const v = value[run.name];
          if (v === undefined || v === null)
            return bail(`"${field.name}" carries no value for "${run.name}"`);
          const n = BigInt(v as number);
          if (n < 0n || n >= 1n << BigInt(run.width))
            bail(
              `${String(v)} does not fit the ${run.width} bits of "${run.name}"`,
            );
          word |= n << taken;
          taken += BigInt(run.width);
        }
        const out = new Uint8Array(field.size);
        for (let i = 0; i < field.size; i += 1)
          out[i] = Number((word >> BigInt(8 * i)) & 0xffn);
        parts.push(out);
        break;
      }
      default: {
        const little = (field.endian ?? context.endian) === "little";
        const raw = writeScalar(field.type, value, little);
        parts.push(field.enciphered === true ? encipher(field, raw) : raw);
      }
    }
  }
  return concat(parts);
}

// A value for every field, zero or empty throughout, honouring the counts and
// sizes a layout fixes. A check overrides what it cares about and leaves the
// rest blank, which is how "a server writes zero" reads in code.
function blank(
  fields: readonly Field[],
  structs: ReadonlyMap<string, readonly Field[]>,
): Values {
  const out: Record<string, Value> = {};
  const one = (field: Field): Value => {
    // A field present only while bytes remain is left out, so the message
    // ends before it; any other rule decides for itself once values are set.
    if (field.present?.when === "remaining") return null;
    switch (field.type) {
      case "bytes":
        return typeof field.size === "number" ? "00".repeat(field.size) : "";
      case "string":
        return "";
      case "array":
        return typeof field.count === "number"
          ? Array.from({ length: field.count }, () => one(field.items))
          : [];
      case "struct":
        return blank(
          structs.get(field.struct) ??
            bail(`struct "${field.struct}" has no definition`),
          structs,
        );
      case "bitArray":
        return [];
      case "record":
        return blank(field.fields, structs);
      case "bits":
        return Object.fromEntries(field.bits.map((r) => [r.name, 0]));
      default:
        return field.type === "u64" || field.type === "i64" ? "0" : 0;
    }
  };
  for (const field of fields) out[field.name] = one(field);
  return out;
}

export {
  blank,
  CodecError,
  concat,
  decodeFields,
  encodeFields,
  hex,
  isRecord,
  isScalar,
  unhex,
};
export type { Cipher, Context, Value, Values };
