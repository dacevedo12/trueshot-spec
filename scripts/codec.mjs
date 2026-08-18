// A reference decoder and encoder, so a vector is checked rather than trusted.
//
// A vector claims two things: that its bytes decode to its fields, and that its
// fields encode back to its bytes. Nothing verified either until this existed,
// which meant a vector with the wrong expected values would be committed and
// every implementation built to match it would be wrong the same way.
//
// How a decoded value is written is part of the format, and schema/meta/vector
// records it. In short: a 64 bit integer is a decimal string
// because JSON cannot hold one exactly, a byte run is lower case hexadecimal, a
// fixed size string drops its trailing zero bytes, an array is an array, and a
// struct or a run of bits is an object.

const WIDTH = {
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
const BIG = new Set(["u64", "i64"]);

class CodecError extends Error {}
const bail = (message) => {
  throw new CodecError(message);
};

const orderOf = (field, fallback) => (field.endian ?? fallback) === "big";

function readScalar(buffer, offset, type, big) {
  const width = WIDTH[type];
  if (offset + width > buffer.length) bail(`ran past the end reading ${type}`);
  const at = offset;
  let value;
  switch (type) {
    case "u8":
      value = buffer.readUInt8(at);
      break;
    case "i8":
      value = buffer.readInt8(at);
      break;
    case "u16":
      value = big ? buffer.readUInt16BE(at) : buffer.readUInt16LE(at);
      break;
    case "i16":
      value = big ? buffer.readInt16BE(at) : buffer.readInt16LE(at);
      break;
    case "u32":
      value = big ? buffer.readUInt32BE(at) : buffer.readUInt32LE(at);
      break;
    case "i32":
      value = big ? buffer.readInt32BE(at) : buffer.readInt32LE(at);
      break;
    case "u64":
      value = (
        big ? buffer.readBigUInt64BE(at) : buffer.readBigUInt64LE(at)
      ).toString();
      break;
    case "i64":
      value = (
        big ? buffer.readBigInt64BE(at) : buffer.readBigInt64LE(at)
      ).toString();
      break;
    case "f32":
      value = big ? buffer.readFloatBE(at) : buffer.readFloatLE(at);
      break;
    case "f64":
      value = big ? buffer.readDoubleBE(at) : buffer.readDoubleLE(at);
      break;
    default:
      bail(`unknown scalar type ${type}`);
  }
  return { value, offset: at + width };
}

function writeScalar(type, value, big) {
  const buffer = Buffer.alloc(WIDTH[type]);
  const asBig = BIG.has(type);
  if (asBig && typeof value !== "string") {
    bail(`${type} is written as a decimal string, not ${typeof value}`);
  }
  if (!asBig && typeof value !== "number") {
    bail(`${type} is written as a number, not ${typeof value}`);
  }
  try {
    writeInto(buffer, type, value, big);
  } catch (error) {
    if (error instanceof CodecError) throw error;
    bail(`${value} does not fit a ${type}`);
  }
  return buffer;
}

function writeInto(buffer, type, value, big) {
  switch (type) {
    case "u8":
      buffer.writeUInt8(value);
      break;
    case "i8":
      buffer.writeInt8(value);
      break;
    case "u16":
      big ? buffer.writeUInt16BE(value) : buffer.writeUInt16LE(value);
      break;
    case "i16":
      big ? buffer.writeInt16BE(value) : buffer.writeInt16LE(value);
      break;
    case "u32":
      big ? buffer.writeUInt32BE(value) : buffer.writeUInt32LE(value);
      break;
    case "i32":
      big ? buffer.writeInt32BE(value) : buffer.writeInt32LE(value);
      break;
    case "u64":
      big
        ? buffer.writeBigUInt64BE(BigInt(value))
        : buffer.writeBigUInt64LE(BigInt(value));
      break;
    case "i64":
      big
        ? buffer.writeBigInt64BE(BigInt(value))
        : buffer.writeBigInt64LE(BigInt(value));
      break;
    case "f32":
      big ? buffer.writeFloatBE(value) : buffer.writeFloatLE(value);
      break;
    case "f64":
      big ? buffer.writeDoubleBE(value) : buffer.writeDoubleLE(value);
      break;
    default:
      bail(`unknown scalar type ${type}`);
  }
}

// A reference may name a field or a run of bits inside one.
function lookup(scope, path) {
  const [head, run] = path.split(".");
  const value = scope[head];
  if (value === undefined) bail(`"${path}" was not read before it was needed`);
  return run === undefined ? value : value?.[run];
}

function present(field, scope) {
  if (!field.present) return true;
  const value = lookup(scope, field.present.when);
  return field.present.equals === undefined
    ? Number(value) !== 0
    : Number(value) === field.present.equals;
}

function countOf(field, scope, key) {
  const raw = field[key];
  if (typeof raw === "number") return raw;
  if (raw === "remaining" || raw === "terminated") return raw;
  const value = Number(lookup(scope, raw));
  if (!Number.isInteger(value) || value < 0) bail(`"${raw}" is not a count`);
  return value;
}

function decodeFields(fields, buffer, offset, structs, endian, outer = {}) {
  const scope = { ...outer };
  const values = {};

  for (const field of fields) {
    if (!present(field, scope)) {
      values[field.name] = null;
      scope[field.name] = null;
      continue;
    }
    const big = orderOf(field, endian);
    let value;

    switch (field.type) {
      case "bytes": {
        const size = countOf(field, scope, "size");
        const length = size === "remaining" ? buffer.length - offset : size;
        if (offset + length > buffer.length)
          bail(`"${field.name}" runs past the end`);
        value = buffer.subarray(offset, offset + length).toString("hex");
        offset += length;
        break;
      }
      case "string": {
        const size = countOf(field, scope, "size");
        let length;
        if (size === "remaining") {
          length = buffer.length - offset;
        } else if (size === "terminated") {
          const end = buffer.indexOf(0, offset);
          if (end === -1) bail(`"${field.name}" has no terminator`);
          length = end - offset + 1;
        } else {
          length = size;
        }
        if (offset + length > buffer.length)
          bail(`"${field.name}" runs past the end`);
        const raw = buffer.subarray(offset, offset + length);
        let end = raw.length;
        while (end > 0 && raw[end - 1] === 0) end -= 1;
        value = raw
          .subarray(0, end)
          .toString(field.encoding === "ascii" ? "ascii" : "utf8");
        offset += length;
        break;
      }
      case "array": {
        if (field.size !== undefined) {
          const bound = countOf(field, scope, "size");
          if (offset + bound > buffer.length) {
            bail(
              `"${field.name}" claims ${bound} bytes and runs past the end`,
            );
          }
          const within = buffer.subarray(0, offset + bound);
          const items = [];
          while (offset < within.length) {
            const read = decodeFields(
              [field.items],
              within,
              offset,
              structs,
              endian,
              scope,
            );
            if (read.offset === offset) {
              bail(`"${field.name}" holds an item that consumes no bytes`);
            }
            items.push(read.values[field.items.name]);
            offset = read.offset;
          }
          values[field.name] = items;
          scope[field.name] = items;
          continue;
        }
        const count = countOf(field, scope, "count");
        const items = [];
        if (count === "remaining") {
          while (offset < buffer.length) {
            const read = decodeFields(
              [field.items],
              buffer,
              offset,
              structs,
              endian,
              scope,
            );
            if (read.offset === offset) {
              bail(`"${field.name}" holds an item that consumes no bytes`);
            }
            items.push(read.values[field.items.name]);
            offset = read.offset;
          }
        } else {
          for (let i = 0; i < count; i += 1) {
            const read = decodeFields(
              [field.items],
              buffer,
              offset,
              structs,
              endian,
              scope,
            );
            items.push(read.values[field.items.name]);
            offset = read.offset;
          }
        }
        value = items;
        break;
      }
      case "struct": {
        const definition = structs.get(field.struct);
        if (!definition) bail(`struct "${field.struct}" has no definition`);
        const bound =
          field.size === undefined ? null : countOf(field, scope, "size");
        const within =
          bound === null ? buffer : buffer.subarray(0, offset + bound);
        if (bound !== null && offset + bound > buffer.length) {
          bail(`"${field.name}" claims ${bound} bytes and runs past the end`);
        }
        const read = decodeFields(
          definition.fields,
          within,
          offset,
          structs,
          endian,
        );
        if (bound !== null && read.offset !== offset + bound) {
          bail(
            `"${field.name}" is ${bound} bytes and its fields read ${read.offset - offset}`,
          );
        }
        value = read.values;
        offset = read.offset;
        break;
      }
      case "bits": {
        if (offset + field.size > buffer.length)
          bail(`"${field.name}" runs past the end`);
        let word = 0n;
        for (let i = field.size - 1; i >= 0; i -= 1) {
          word = (word << 8n) | BigInt(buffer[offset + i]);
        }
        const runs = {};
        let taken = 0n;
        for (const run of field.bits) {
          const mask = (1n << BigInt(run.width)) - 1n;
          runs[run.name] = Number((word >> taken) & mask);
          taken += BigInt(run.width);
        }
        value = runs;
        offset += field.size;
        break;
      }
      default: {
        const read = readScalar(buffer, offset, field.type, big);
        value = read.value;
        offset = read.offset;
      }
    }

    values[field.name] = value;
    scope[field.name] = value;
  }

  return { values, offset };
}

function encodeFields(fields, values, structs, endian, outer = {}) {
  const scope = { ...outer, ...values };
  const parts = [];

  for (const field of fields) {
    if (!present(field, scope)) continue;
    const value = values[field.name];
    if (value === null || value === undefined) {
      bail(`"${field.name}" is present but carries no value`);
    }
    const big = orderOf(field, endian);

    switch (field.type) {
      case "bytes":
        parts.push(Buffer.from(value, "hex"));
        break;
      case "string": {
        const text = Buffer.from(
          value,
          field.encoding === "ascii" ? "ascii" : "utf8",
        );
        const size = countOf(field, scope, "size");
        if (size === "remaining") {
          parts.push(text);
        } else if (size === "terminated") {
          parts.push(Buffer.concat([text, Buffer.alloc(1)]));
        } else {
          if (text.length > size)
            bail(`"${field.name}" is longer than ${size} bytes`);
          parts.push(Buffer.concat([text, Buffer.alloc(size - text.length)]));
        }
        break;
      }
      case "array": {
        const counted =
          field.size === undefined
            ? countOf(field, scope, "count")
            : "remaining";
        if (counted !== "remaining" && counted !== value.length) {
          bail(
            `"${field.name}" holds ${value.length} items and its count says ${counted}`,
          );
        }
        const written = [];
        for (const item of value) {
          written.push(
            encodeFields(
              [field.items],
              { [field.items.name]: item },
              structs,
              endian,
              scope,
            ),
          );
        }
        const body = Buffer.concat(written);
        if (field.size !== undefined) {
          const bound = countOf(field, scope, "size");
          if (body.length !== bound) {
            bail(
              `"${field.name}" writes ${body.length} bytes and its size says ${bound}`,
            );
          }
        }
        parts.push(body);
        break;
      }
      case "struct": {
        const definition = structs.get(field.struct);
        if (!definition) bail(`struct "${field.struct}" has no definition`);
        const written = encodeFields(
          definition.fields,
          value,
          structs,
          endian,
        );
        if (field.size !== undefined) {
          const bound = countOf(field, scope, "size");
          if (written.length !== bound) {
            bail(
              `"${field.name}" writes ${written.length} bytes and its size says ${bound}`,
            );
          }
        }
        parts.push(written);
        break;
      }
      case "bits": {
        let word = 0n;
        let taken = 0n;
        for (const run of field.bits) {
          const mask = (1n << BigInt(run.width)) - 1n;
          if (value[run.name] === undefined || value[run.name] === null) {
            bail(`"${field.name}" carries no value for "${run.name}"`);
          }
          const bits = BigInt(value[run.name]);
          if (bits < 0n || bits > mask) {
            bail(
              `${value[run.name]} does not fit the ${run.width} bits of "${run.name}"`,
            );
          }
          word |= bits << taken;
          taken += BigInt(run.width);
        }
        const buffer = Buffer.alloc(field.size);
        for (let i = 0; i < field.size; i += 1) {
          buffer[i] = Number((word >> BigInt(8 * i)) & 0xffn);
        }
        parts.push(buffer);
        break;
      }
      default:
        parts.push(writeScalar(field.type, value, big));
    }
  }

  return Buffer.concat(parts);
}

export { CodecError, decodeFields, encodeFields };
