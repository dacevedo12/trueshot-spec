// One channel payload: the family header, then the body a revision lays out.

import {
  blank,
  CodecError,
  concat,
  decodeFields,
  encodeFields,
  isRecord,
} from "./codec.ts";
import type { Cipher, Value, Values } from "./codec.ts";
import type { Channel, Family, Layouts, Revision } from "./schema.ts";

interface Message {
  readonly name: string;
  readonly channel: string;
  // The family header's fields, then the body's, as a vector's `fields` holds them.
  readonly fields: Values;
}

// A family whose header carries no command numbers its one message 0.
function headerValues(
  family: Family,
  revision: Revision,
  header: Values,
): Values {
  const out: Record<string, Value> = {};
  for (const field of family.header) out[field.name] = header[field.name] ?? 0;
  const spec = family.command;
  if (spec === undefined) return out;
  const wide =
    spec.escape !== undefined &&
    spec.extendedField !== undefined &&
    revision.command > 0xff;
  out[spec.field] = wide ? (spec.escape ?? 0) : revision.command;
  if (spec.extendedField !== undefined) {
    out[spec.extendedField] = wide ? revision.command : null;
  }
  return out;
}

function encodeMessage(
  layouts: Layouts,
  name: string,
  fields: Values,
  cipher?: Cipher,
): Uint8Array {
  const revision = layouts.message(name);
  const family = layouts.family(layouts.channel(revision.channel).family);
  const context = {
    structs: layouts.structs,
    endian: layouts.protocol.endian,
    ...(cipher === undefined ? {} : { cipher }),
  };
  const header = encodeFields(
    family.header,
    headerValues(family, revision, fields),
    context,
  );
  const body = encodeFields(revision.fields, fields, context);
  return concat([header, body]);
}

// A body of zeros with the given fields laid over it.
function compose(layouts: Layouts, name: string, fields: Values): Values {
  const revision = layouts.message(name);
  return overlay(blank(revision.fields, layouts.structs), fields);
}

// Objects merge field by field, and so do the items of two arrays, so a check
// names only the parts of a struct it cares about.
function lay(under: Value | undefined, value: Value): Value {
  if (isRecord(under) && isRecord(value)) return overlay(under, value);
  if (Array.isArray(under) && Array.isArray(value)) {
    const below = under as readonly Value[];
    return (value as readonly Value[]).map((item, i) =>
      lay(below[i] ?? below[0], item),
    );
  }
  return value;
}

function overlay(base: Values, over: Values): Values {
  const out: Record<string, Value> = { ...base };
  for (const [key, value] of Object.entries(over))
    out[key] = lay(base[key], value);
  return out;
}

function decodeHeader(
  layouts: Layouts,
  channel: Channel,
  bytes: Uint8Array,
): { values: Values; offset: number; command: number } {
  const family = layouts.family(channel.family);
  const context = {
    structs: layouts.structs,
    endian: layouts.protocol.endian,
  };
  const read = decodeFields(family.header, bytes, 0, context);
  const spec = family.command;
  if (spec === undefined) return { ...read, command: 0 };
  const lead = Number(read.values[spec.field]);
  const command =
    lead === spec.escape && spec.extendedField !== undefined
      ? Number(read.values[spec.extendedField])
      : lead;
  return { ...read, command };
}

function decodeMessage(
  layouts: Layouts,
  channel: Channel,
  bytes: Uint8Array,
  toServer: boolean,
  cipher?: Cipher,
): Message {
  const header = decodeHeader(layouts, channel, bytes);
  const name = layouts.identify(channel, header.command, toServer);
  if (name === undefined) {
    throw new CodecError(
      `command ${header.command} on ${channel.name} names no message for ${layouts.build}`,
    );
  }
  const revision = layouts.message(name);
  const context = {
    structs: layouts.structs,
    endian: layouts.protocol.endian,
    ...(cipher === undefined ? {} : { cipher }),
  };
  const body = decodeFields(revision.fields, bytes, header.offset, context);
  if (body.offset !== bytes.length && name !== "Registered") {
    throw new CodecError(
      `${name} leaves ${bytes.length - body.offset} bytes unread`,
    );
  }
  return {
    name,
    channel: channel.name,
    fields: { ...header.values, ...body.values },
  };
}

export { compose, decodeHeader, decodeMessage, encodeMessage, overlay };
export type { Message };
