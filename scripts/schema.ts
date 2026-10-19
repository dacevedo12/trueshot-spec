// The definitions under schema/, typed. The harness reads them as data and
// builds every layout from them, so a check exercises the specification rather
// than a copy of it. `bun run check` validates the files against schema/meta;
// this module trusts that and only narrows the JSON to these types.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "schema");

type Scalar =
  "u8" | "i8" | "u16" | "i16" | "u32" | "i32" | "u64" | "i64" | "f32" | "f64";
type Endian = "little" | "big";
type Amount =
  number | string | { readonly field: string; readonly minus: number };
type Size = Amount | "remaining" | "terminated";

interface Presence {
  readonly when: string;
  readonly equals?: number | readonly number[];
}

interface BitRun {
  readonly name: string;
  readonly width: number;
}

interface Common {
  readonly name: string;
  readonly note?: string;
  readonly present?: Presence;
  readonly values?: Readonly<Record<string, { readonly name: string }>>;
}

type Field =
  | (Common & {
      readonly type: Scalar;
      readonly endian?: Endian;
      readonly enciphered?: boolean;
    })
  | (Common & {
      readonly type: "bytes";
      readonly size: Size;
      readonly enciphered?: boolean;
    })
  | (Common & {
      readonly type: "string";
      readonly size: Size;
      readonly encoding: "utf8" | "ascii";
    })
  | (Common & {
      readonly type: "array";
      readonly items: Field;
      readonly count?: Amount | "remaining";
      readonly size?: Amount;
    })
  | (Common & {
      readonly type: "struct";
      readonly struct: string;
      readonly size?: Amount;
    })
  | (Common & {
      readonly type: "bits";
      readonly size: number;
      readonly bits: readonly BitRun[];
      readonly endian?: Endian;
    })
  | (Common & {
      readonly type: "bitArray";
      readonly count: Amount | "remaining";
      readonly bits: readonly BitRun[];
    })
  | (Common & { readonly type: "record"; readonly fields: readonly Field[] });

type Direction = "clientToServer" | "serverToClient" | "bidirectional";
type Reliability = "reliable" | "unreliable" | "unsequenced";

interface Ranged {
  readonly from: string;
  readonly until?: string;
}

interface Revision extends Ranged {
  readonly channel: string;
  readonly command: number;
  readonly direction: Direction;
  readonly reliability: Reliability;
  readonly fields: readonly Field[];
  readonly alsoOn?: readonly {
    readonly channel: string;
    readonly reliability: Reliability;
  }[];
}

interface MessageFile {
  readonly message: string;
  readonly system: string;
  readonly revisions: readonly Revision[];
}

interface StructFile {
  readonly struct: string;
  readonly revisions?: readonly (Ranged & {
    readonly fields: readonly Field[];
  })[];
  readonly fields?: readonly Field[];
}

interface Family {
  readonly name: string;
  readonly command?: {
    readonly field: string;
    readonly escape?: number;
    readonly extendedField?: string;
    readonly reserved?: readonly number[];
  };
  readonly header: readonly Field[];
}

interface Channel {
  readonly name: string;
  readonly id: number;
  readonly family: string;
}

interface Constant {
  readonly name: string;
  readonly value: number;
}

interface Protocol extends Ranged {
  readonly endian: Endian;
  readonly cipher: { readonly blockSize: number; readonly keySize: number };
  readonly transport: {
    readonly header: readonly Field[];
    readonly constants: readonly Constant[];
  };
}

const read = <T>(path: string): T =>
  JSON.parse(readFileSync(path, "utf8")) as T;

// A build is four numbers, compared part by part.
function compare(a: string, b: string): number {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 4; i += 1) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

const covers = (range: Ranged, build: string): boolean =>
  compare(build, range.from) >= 0 &&
  (range.until === undefined || compare(build, range.until) < 0);

function pick<T extends Ranged>(
  revisions: readonly T[],
  build: string,
): T | undefined {
  return revisions.find((r) => covers(r, build));
}

class SchemaError extends Error {
  override readonly name = "SchemaError";
}

// Everything one build needs, resolved once: its byte order, transport, channels
// and families, and the revision of every message and struct that covers it.
class Layouts {
  readonly build: string;
  readonly protocol: Protocol;
  readonly channels: ReadonlyMap<string, Channel>;
  readonly families: ReadonlyMap<string, Family>;
  readonly structs: ReadonlyMap<string, readonly Field[]>;
  readonly messages: ReadonlyMap<string, Revision>;

  // `transport` takes the header, channels and families from another build,
  // and `messages` the revision of each message it names from the build it
  // names: both only for trying a build the specification does not cover.
  constructor(
    build: string,
    mix: {
      readonly transport?: string;
      readonly messages?: ReadonlyMap<string, string>;
    } = {},
  ) {
    this.build = build;
    const carrier = mix.transport ?? build;
    const protocol = pick(
      read<{ revisions: Protocol[] }>(join(ROOT, "protocol.json")).revisions,
      carrier,
    );
    if (protocol === undefined)
      throw new SchemaError(`the specification does not cover ${build}`);
    this.protocol = protocol;

    const channels = pick(
      read<{ revisions: (Ranged & { channels: Channel[] })[] }>(
        join(ROOT, "channels.json"),
      ).revisions,
      carrier,
    );
    const families = pick(
      read<{ revisions: (Ranged & { families: Family[] })[] }>(
        join(ROOT, "families.json"),
      ).revisions,
      carrier,
    );
    if (channels === undefined || families === undefined) {
      throw new SchemaError(`channels or families do not cover ${build}`);
    }
    this.channels = new Map(channels.channels.map((c) => [c.name, c]));
    this.families = new Map(families.families.map((f) => [f.name, f]));

    const structs = new Map<string, readonly Field[]>();
    for (const file of readdirSync(join(ROOT, "types"))) {
      if (!file.endsWith(".json")) continue;
      const struct = read<StructFile>(join(ROOT, "types", file));
      const fields =
        struct.revisions === undefined
          ? struct.fields
          : pick(struct.revisions, build)?.fields;
      if (fields !== undefined) structs.set(struct.struct, fields);
    }
    this.structs = structs;

    const messages = new Map<string, Revision>();
    for (const file of readdirSync(join(ROOT, "messages"))) {
      if (!file.endsWith(".json")) continue;
      const message = read<MessageFile>(join(ROOT, "messages", file));
      const revision = pick(
        message.revisions,
        mix.messages?.get(message.message) ?? build,
      );
      if (revision !== undefined) messages.set(message.message, revision);
    }
    this.messages = messages;
  }

  constant(name: string): number {
    const found = this.protocol.transport.constants.find(
      (c) => c.name === name,
    );
    if (found === undefined)
      throw new SchemaError(`no constant ${name} for ${this.build}`);
    return found.value;
  }

  message(name: string): Revision {
    const found = this.messages.get(name);
    if (found === undefined)
      throw new SchemaError(`${name} has no revision covering ${this.build}`);
    return found;
  }

  channel(name: string): Channel {
    const found = this.channels.get(name);
    if (found === undefined)
      throw new SchemaError(`no channel ${name} for ${this.build}`);
    return found;
  }

  channelById(id: number): Channel | undefined {
    for (const channel of this.channels.values())
      if (channel.id === id) return channel;
    return undefined;
  }

  family(name: string): Family {
    const found = this.families.get(name);
    if (found === undefined)
      throw new SchemaError(`no family ${name} for ${this.build}`);
    return found;
  }

  // The message a payload carries, from where it came in, its command and
  // which way it travelled.
  identify(
    channel: Channel,
    command: number,
    toServer: boolean,
  ): string | undefined {
    const wanted: Direction = toServer ? "clientToServer" : "serverToClient";
    for (const [name, r] of this.messages) {
      if (r.command !== command) continue;
      if (r.direction !== wanted && r.direction !== "bidirectional") continue;
      const on = [r.channel, ...(r.alsoOn ?? []).map((a) => a.channel)];
      const family = this.channels.get(r.channel)?.family;
      if (on.includes(channel.name) || family === channel.family) return name;
    }
    return undefined;
  }
}

// The ranges of versions the specification covers: the spans between every
// build at which any definition starts or stops, wherever a packet header
// covers them. Every build in a range is held to the same definitions.
function ranges(): Ranged[] {
  const lists: (readonly Ranged[])[] = [];
  const files = (dir: string): string[] =>
    readdirSync(join(ROOT, dir))
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(ROOT, dir, f));
  for (const path of [
    join(ROOT, "protocol.json"),
    join(ROOT, "channels.json"),
    join(ROOT, "families.json"),
    ...files("messages"),
    ...files("types"),
  ]) {
    const doc = read<{ revisions?: Ranged[] }>(path);
    if (doc.revisions !== undefined) lists.push(doc.revisions);
  }
  const protocol = lists[0] ?? [];
  const points = [
    ...new Set(
      lists.flatMap((l) =>
        l.flatMap((r) =>
          r.until === undefined ? [r.from] : [r.from, r.until],
        ),
      ),
    ),
  ].sort(compare);
  const out: Ranged[] = [];
  points.forEach((from, i) => {
    if (!protocol.some((r) => covers(r, from))) return;
    const until = points[i + 1];
    out.push(until === undefined ? { from } : { from, until });
  });
  return out;
}

export { compare, covers, Layouts, ranges, SchemaError };
export type {
  Ranged,
  Amount,
  BitRun,
  Channel,
  Direction,
  Endian,
  Family,
  Field,
  Presence,
  Reliability,
  Revision,
  Scalar,
  Size,
};
