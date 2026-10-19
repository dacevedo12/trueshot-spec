// Checks the schema files for things JSON Schema cannot express.
//
// JSON Schema validates the shape of a definition. It cannot tell whether a
// channel exists at the version a message claims, whether a struct reference
// resolves, whether a reference points backwards at something countable, or
// whether two revisions claim the same command value over the same versions.
// Those checks live here.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import { ALGORITHMS } from "./algorithms.ts";
import { BLOCK, Blowfish } from "./cipher.ts";
import {
  CodecError,
  decodeFields,
  encodeFields,
  hex,
  unhex,
} from "./codec.ts";
import type { Cipher, Value, Values } from "./codec.ts";
import type { Amount, Endian, Field, Size } from "./schema.ts";

const SCHEMA_DIR = "schema";
const META = join(SCHEMA_DIR, "meta");
const VECTOR_DIR = join("conformance", "vectors");

const COUNTABLE = new Set(["u8", "u16", "u32", "u64"]);
const TRUTHY = new Set([...COUNTABLE, "i8", "i16", "i32", "i64"]);
const RESERVED = new Set(["remaining", "terminated"]);
const SCALAR_BITS: Readonly<Record<string, number>> = {
  u8: 8,
  i8: 8,
  u16: 16,
  i16: 16,
  u32: 32,
  i32: 32,
  u64: 64,
  i64: 64,
};

// What the meta-schemas guarantee a definition holds, read loosely enough that
// one shape serves a field, an item and a run of bits.
interface Presence {
  readonly when: string;
  readonly equals?: number | readonly number[] | undefined;
  readonly unseen?: "present" | "absent" | undefined;
}

interface FieldLike {
  readonly name: string;
  readonly type?: string | undefined;
  readonly width?: number | undefined;
  readonly present?: Presence | undefined;
  readonly values?:
    Readonly<Record<string, { readonly name: string }>> | undefined;
  readonly size?: Size | undefined;
  readonly count?: Amount | "remaining" | undefined;
  readonly items?: FieldLike | undefined;
  readonly struct?: string | undefined;
  readonly bits?: readonly FieldLike[] | undefined;
  readonly fields?: readonly FieldLike[] | undefined;
  readonly enciphered?: boolean | undefined;
  readonly endian?: Endian | undefined;
}

interface Ranged {
  readonly from: string;
  readonly until?: string | undefined;
}

interface ProtocolRevision extends Ranged {
  readonly endian?: Endian | undefined;
  readonly cipher?: { readonly keySize?: number | undefined } | undefined;
  readonly transport?:
    { readonly header?: readonly FieldLike[] | undefined } | undefined;
}

interface ChannelDef {
  readonly name: string;
  readonly id: number;
  readonly family?: string | undefined;
}

interface ChannelsRevision extends Ranged {
  readonly channels?: readonly ChannelDef[] | undefined;
}

interface CommandSpec {
  readonly field?: string | undefined;
  readonly escape?: number | undefined;
  readonly extendedField?: string | undefined;
  readonly reserved?: readonly number[] | undefined;
}

interface FamilyDef {
  readonly name: string;
  readonly command?: CommandSpec | undefined;
  readonly header: readonly FieldLike[];
}

interface FamiliesRevision extends Ranged {
  readonly families?: readonly FamilyDef[] | undefined;
}

type Direction = "clientToServer" | "serverToClient" | "bidirectional";

interface MessageRevision extends Ranged {
  readonly channel: string;
  readonly command: number;
  readonly direction: Direction;
  readonly fields: readonly FieldLike[];
  readonly alsoOn?: readonly { readonly channel: string }[] | undefined;
}

interface MessageDoc {
  readonly message: string;
  readonly revisions: readonly MessageRevision[];
}

interface StructDoc {
  readonly struct: string;
  readonly fields: readonly FieldLike[];
}

interface VectorDoc {
  readonly subject:
    "transport" | "cipher" | "message" | "struct" | "algorithm";
  readonly message?: string | undefined;
  readonly struct?: string | undefined;
  readonly channel?: string | undefined;
  readonly version?: string | undefined;
  readonly key?: string | undefined;
  readonly bytes?: string | undefined;
  readonly fields?: Values | undefined;
  readonly plaintext?: string | undefined;
  readonly ciphertext?: string | undefined;
  readonly algorithm?: string | undefined;
  readonly input?:
    { readonly vector: string; readonly field: string } | undefined;
  readonly output?: Value | undefined;
}

interface Documents<T> {
  readonly revisions?: readonly T[] | undefined;
}

interface Index {
  readonly schemas: Readonly<Record<string, string>>;
}

interface MetaSchema {
  readonly $id: string;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// Prose carried as data reaches a reader the same way the documents do, and no
// linter reads JSON. Every prose rule is read from the file the documents are
// held to rather than copied here, which would drift.
const STYLES = join("styles", "trueshot");
const escape = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const loadRule = (file: string): { say: string; tests: RegExp[] } => {
  const text = readFileSync(join(STYLES, file), "utf8");
  const message = /^message:\s*"(.+)"\s*$/m.exec(text);
  const nonword = /^nonword:\s*true\s*$/m.test(text);
  // A rule that does not ask to ignore case means the case it wrote.
  const anyCase = /^ignorecase:\s*true\s*$/m.test(text);
  const tokens = text
    .split("\n")
    .map((line) => /^\s*-\s*['"]?(.+?)['"]?\s*$/.exec(line)?.[1])
    .filter((token): token is string => token !== undefined);
  return {
    say: message?.[1] ?? file,
    // A rule matching non-words carries its own anchoring, if any.
    tests: tokens.map(
      (token) =>
        new RegExp(
          nonword ? token : `\\b${escape(token)}\\b`,
          anyCase ? "i" : "",
        ),
    ),
  };
};

// The rules that apply wherever prose appears. Version-relative language and
// requirement keywords are handled on their own below, because what they mean
// in a note differs from what they mean in a document.
const PROSE = ["hedging.yml", "em-dash.yml"].map(loadRule);
const TEMPORAL = loadRule("version-relative.yml").tests;

const problems: string[] = [];
const fail = (where: string, message: string): void => {
  problems.push(`${where}: ${message}`);
};
const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8"));

function readConfig(path: string): unknown {
  try {
    return readJson(path);
  } catch (error) {
    fail(path, `could not be read: ${messageOf(error)}`);
    return null;
  }
}

function listJson(dir: string): { name: string; path: string }[] {
  const path = join(SCHEMA_DIR, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .sort()
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({ name, path: join(path, name) }));
}

const parseVersion = (text: string): number[] => text.split(".").map(Number);

function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let i = 0; i < 4; i += 1) {
    const l = left[i] ?? NaN;
    const r = right[i] ?? NaN;
    if (l !== r) return l - r;
  }
  return 0;
}

// Revisions cover [from, until). An absent `until` runs forever.
function rangesOverlap(a: Ranged, b: Ranged): boolean {
  const aStartsBeforeBEnds = !b.until || compareVersions(a.from, b.until) < 0;
  const bStartsBeforeAEnds = !a.until || compareVersions(b.from, a.until) < 0;
  return aStartsBeforeBEnds && bStartsBeforeAEnds;
}

const covers = (revision: Ranged, version: string): boolean =>
  compareVersions(version, revision.from) >= 0 &&
  (!revision.until || compareVersions(version, revision.until) < 0);

// The first version of a range that no revision in a list accounts for, or
// null where the list covers the range end to end.
function uncoveredIn(
  revisions: readonly Ranged[],
  range: Ranged,
): string | null {
  const sorted = [...revisions].sort((a, b) =>
    compareVersions(a.from, b.from),
  );
  let cursor = range.from;
  let open = false;
  for (const r of sorted) {
    if (range.until && compareVersions(r.from, range.until) >= 0) break;
    if (compareVersions(r.from, cursor) > 0) return cursor;
    if (!r.until) {
      open = true;
      break;
    }
    if (compareVersions(r.until, cursor) > 0) cursor = r.until;
  }
  if (open) return null;
  if (!range.until) return cursor;
  return compareVersions(cursor, range.until) < 0 ? cursor : null;
}

// A bidirectional message occupies its command value in both directions.
const directionsOverlap = (a: Direction, b: Direction): boolean =>
  a === b || a === "bidirectional" || b === "bidirectional";

// Every list of revisions holds to the same rules, whatever it describes.
function checkRevisions(revisions: readonly Ranged[], where: string): void {
  revisions.forEach((revision, index) => {
    if (
      revision.until &&
      compareVersions(revision.from, revision.until) >= 0
    ) {
      fail(
        `${where} revision ${index}`,
        `from "${revision.from}" is not before until "${revision.until}"`,
      );
    }
  });
  for (let i = 0; i < revisions.length; i += 1) {
    for (let j = i + 1; j < revisions.length; j += 1) {
      const a = revisions[i];
      const b = revisions[j];
      if (a !== undefined && b !== undefined && rangesOverlap(a, b)) {
        fail(
          where,
          `revisions ${i} and ${j} cover overlapping client versions`,
        );
      }
    }
  }
}

// A requirement belongs in spec/, where Vale reads it and where a reader
// looks for one. A note records what a client does.
const KEYWORDS = loadRule("requirement.yml").tests;

function checkNotes(
  value: unknown,
  where: string,
  path = "",
  isVector = false,
): void {
  if (Array.isArray(value)) {
    value.forEach((item: unknown, index) =>
      checkNotes(item, where, `${path}[${index}]`, isVector),
    );
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const here = `${path}/${key}`;
    // A vector's "fields" holds decoded wire data. A definition's holds prose.
    if (isVector && key === "fields") continue;
    if (
      (key === "note" || key === "description") &&
      typeof child === "string"
    ) {
      for (const token of TEMPORAL) {
        const hit = token.exec(child);
        if (hit) {
          fail(
            where,
            `${here} says "${hit[0]}", which describes a moment rather than a version`,
          );
        }
      }
      for (const rule of PROSE) {
        for (const test of rule.tests) {
          const hit = test.exec(child);
          if (hit) {
            fail(
              where,
              `${here} says "${hit[0]}". ${rule.say.replace("%s", hit[0])}`,
            );
          }
        }
      }
      for (const test of KEYWORDS) {
        const keyword = test.exec(child);
        if (keyword) {
          fail(
            where,
            `${here} says "${keyword[0]}", and a requirement belongs in spec/ rather than in a note`,
          );
        }
      }
      continue;
    }
    checkNotes(child, where, here, isVector);
  }
}

// What a field list has declared so far, by name. `__count` carries the count
// of the list an item sits in, and `__open` marks an enclosure running to the
// end.
interface Seen {
  readonly type: string | undefined;
  readonly width?: number | undefined;
  readonly count?: Amount | "remaining" | undefined;
  readonly itemName?: string | undefined;
  readonly runs?: readonly string[] | undefined;
}

// Walks a field list at any depth. `outer` carries the names already read in
// enclosing scopes, so an array element may size itself from an earlier field.
// Bit runs are addressable as parent.bit, which is what a presence rule points
// at.
// A run of bits carries values as a whole field does, so both are read here.
function checkValues(field: FieldLike, at: string, parent?: string): void {
  if (!field.values) return;
  const label = parent ? `"${parent}.${field.name}"` : `"${field.name}"`;
  const bits = field.width ?? SCALAR_BITS[field.type ?? ""] ?? NaN;
  const signed = field.width === undefined && field.type?.startsWith("i");
  const low = signed ? -(2 ** (bits - 1)) : 0;
  const high = signed ? 2 ** (bits - 1) - 1 : 2 ** bits - 1;
  const what = field.width === undefined ? `a ${field.type}` : `${bits} bits`;
  const names = new Set<string>();
  for (const [key, entry] of Object.entries(field.values)) {
    const value = Number(key);
    if (bits <= 53 && (value < low || value > high)) {
      fail(
        at,
        `field ${label} gives a meaning for ${key}, which does not fit ${what}`,
      );
    }
    if (names.has(entry.name)) {
      fail(
        at,
        `field ${label} uses the name "${entry.name}" for more than one value`,
      );
    }
    names.add(entry.name);
  }
}

function checkFields(
  fields: readonly FieldLike[],
  outer: ReadonlyMap<string, Seen>,
  structNames: ReadonlySet<string>,
  at: string,
  openStructs: ReadonlySet<string> = new Set(),
): Map<string, Seen> {
  const seen = new Map(outer);

  fields.forEach((field, index) => {
    const last = index === fields.length - 1;
    let openEnded = false;

    if (field.enciphered) {
      const width =
        field.type === "bytes"
          ? field.size
          : (SCALAR_BITS[field.type ?? ""] ?? NaN) / 8;
      if (typeof width !== "number" || width % BLOCK !== 0) {
        fail(
          at,
          `field "${field.name}" travels enciphered but does not fill whole ${BLOCK} byte blocks, so part of it would travel in the clear`,
        );
      }
    }

    checkValues(field, at);
    for (const run of field.bits ?? []) checkValues(run, at, field.name);

    // array[item] names the item of an earlier list at the same position, so
    // the two lists have to be counted the same way and cannot be one list.
    const checkItemRef = (where: string, text: string): boolean => {
      const m =
        /^([a-z][A-Za-z0-9]*)\[([a-z][A-Za-z0-9]*)\](?:\.([a-z][A-Za-z0-9]*))?$/.exec(
          text,
        );
      if (!m) return false;
      const [, list = "", item, run] = m;
      const entry = seen.get(list);
      if (!entry) {
        fail(
          at,
          `field "${where}" names "${text}", and "${list}" is not an earlier field`,
        );
      } else if (entry.type !== "bitArray" && entry.type !== "array") {
        fail(
          at,
          `field "${where}" names "${text}", and "${list}" is ${entry.type} rather than a list`,
        );
      } else if (entry.itemName === item) {
        fail(
          at,
          `field "${where}" names "${text}", which is the list it is inside`,
        );
      } else if (
        JSON.stringify(entry.count) !==
        JSON.stringify(outer.get("__count")?.count)
      ) {
        fail(
          at,
          `field "${where}" names "${text}", and the two lists are not counted the same way`,
        );
      } else if (run !== undefined && !(entry.runs ?? []).includes(run)) {
        fail(
          at,
          `field "${where}" names "${text}", and "${list}" holds no run "${run}"`,
        );
      }
      return true;
    };

    if (field.present && field.present.when !== "remaining") {
      const target = field.present.when;
      if (checkItemRef(field.name, target)) {
        // handled above
      } else if (!seen.has(target)) {
        fail(
          at,
          `field "${field.name}" is present when "${target}", which is not an earlier field`,
        );
      } else {
        const entry = seen.get(target);
        const type = entry?.type ?? "";
        if (!TRUTHY.has(type)) {
          fail(
            at,
            `field "${field.name}" is present when "${target}", which is ${entry?.type} and has no truth value`,
          );
        }
        const width = entry?.width ?? SCALAR_BITS[type];
        const equals = field.present.equals;
        if (equals !== undefined && width !== undefined) {
          const signed = entry?.width === undefined && type.startsWith("i");
          const low = signed ? -(2 ** (width - 1)) : 0;
          const high = signed ? 2 ** (width - 1) - 1 : 2 ** width - 1;
          const compared = Number(equals);
          if (compared < low || compared > high) {
            fail(
              at,
              `field "${field.name}" is present when "${target}" equals ${String(equals)}, which ${entry?.type} cannot hold`,
            );
          }
        }
      }
    }

    if (field.type === "bits") {
      const runs = field.bits ?? [];
      const declared = runs.reduce(
        (total, run) => total + (run.width ?? 0),
        0,
      );
      const size = typeof field.size === "number" ? field.size : NaN;
      const available = size * 8;
      if (declared !== available) {
        fail(
          at,
          `field "${field.name}" declares ${declared} bits across ${String(field.size)} byte(s), which holds ${available}`,
        );
      }
      for (const run of runs) {
        const path = `${field.name}.${run.name}`;
        if (seen.has(path)) {
          fail(at, `bit run "${path}" is declared twice`);
        }
        seen.set(path, { type: "u8", width: run.width });
      }
    }

    for (const key of ["count", "size"] as const) {
      const value = field[key];
      if (value && typeof value === "object") {
        if (checkItemRef(field.name, value.field)) continue;
        const entry = seen.get(value.field);
        if (!entry) {
          fail(
            at,
            `field "${field.name}" ${key} refers to "${value.field}", which is not an earlier field`,
          );
        } else if (!COUNTABLE.has(entry.type ?? "")) {
          fail(
            at,
            `field "${field.name}" ${key} refers to "${value.field}", which is ${entry.type} rather than an unsigned integer`,
          );
        }
        continue;
      }
      if (typeof value !== "string") continue;
      if (checkItemRef(field.name, value)) continue;
      if (value === "remaining" && !last) {
        fail(
          at,
          `field "${field.name}" ${key} runs to the end of what encloses it, so nothing may follow it`,
        );
      }
      if (value === "remaining") openEnded = true;
      if (RESERVED.has(value)) continue;
      const entry = seen.get(value);
      if (!entry) {
        fail(
          at,
          `field "${field.name}" ${key} refers to "${value}", which is not an earlier field`,
        );
      } else if (!COUNTABLE.has(entry.type ?? "")) {
        fail(
          at,
          `field "${field.name}" ${key} refers to "${value}", which is ${entry.type} rather than an unsigned integer`,
        );
      }
    }

    const itemRunsOn =
      field.items?.size === "remaining" ||
      (field.items?.type === "struct" &&
        field.items.size === undefined &&
        openStructs.has(field.items.struct ?? ""));
    if (field.type === "array" && itemRunsOn && field.size === undefined) {
      fail(
        at,
        `field "${field.name}" holds items that each run to the end, so the first takes every byte and a count cannot say how many follow`,
      );
    }

    if (field.size === "terminated" && field.type !== "string") {
      fail(
        at,
        `field "${field.name}" is ${field.type}, so it cannot be terminated`,
      );
    }

    if (field.type === "struct") {
      if (!structNames.has(field.struct ?? "")) {
        fail(
          at,
          `field "${field.name}" refers to struct "${field.struct}", which has no definition`,
        );
      } else if (
        openStructs.has(field.struct ?? "") &&
        field.size === undefined &&
        !last
      ) {
        fail(
          at,
          `field "${field.name}" holds struct "${field.struct}", which states no length and runs to the end of what encloses it, so nothing may follow it`,
        );
      }
    }

    if (seen.has(field.name)) {
      fail(
        at,
        outer.has(field.name)
          ? `field "${field.name}" shadows an enclosing field of the same name`
          : `field "${field.name}" is declared twice`,
      );
    }
    seen.set(field.name, {
      type: field.type,
      count: field.count,
      itemName: field.items?.name,
      runs: (field.bits ?? []).map((r) => r.name),
    });

    if (field.type === "array" && field.items) {
      const inner = new Map(seen);
      inner.set("__count", { type: undefined, count: field.count });
      checkFields(
        [field.items],
        inner,
        structNames,
        `${at} > ${field.name}[]`,
        openStructs,
      );
    }
    if (field.type === "record") {
      checkFields(
        field.fields ?? [],
        seen,
        structNames,
        `${at} > ${field.name}`,
        openStructs,
      );
    }
    // A trailing struct that runs to the end makes its enclosure run to the
    // end too, whether the enclosure is a body, another struct, or a header.
    const endsOpen =
      openEnded ||
      (field.type === "struct" &&
        field.size === undefined &&
        openStructs.has(field.struct ?? ""));
    if (endsOpen && last) seen.set("__open", { type: "u8" });
  });

  return seen;
}

const index = readConfig(join(META, "index.json")) as Index | null;
const metaFiles = Object.values(index?.schemas ?? {});
for (const name of readdirSync(META).sort()) {
  if (
    name.endsWith(".json") &&
    name !== "index.json" &&
    !metaFiles.includes(name)
  ) {
    fail(join(META, "index.json"), `does not list ${name}`);
  }
}
const meta: Record<string, unknown> = Object.fromEntries(
  Object.entries(index?.schemas ?? {}).map(([urn, file]) => [
    urn,
    readConfig(join(META, file)),
  ]),
);
const messageSchema = meta["urn:trueshot:schema:message"] as MetaSchema | null;
const structSchema = meta["urn:trueshot:schema:struct"] as MetaSchema | null;
const protocolSchema = meta[
  "urn:trueshot:schema:protocol"
] as MetaSchema | null;
const channelsSchema = meta[
  "urn:trueshot:schema:channels"
] as MetaSchema | null;
const vectorSchema = meta["urn:trueshot:schema:vector"] as MetaSchema | null;
const familiesSchema = meta[
  "urn:trueshot:schema:families"
] as MetaSchema | null;
const protocolDoc = readConfig(
  join(SCHEMA_DIR, "protocol.json"),
) as Documents<ProtocolRevision> | null;
const channelsDoc = readConfig(
  join(SCHEMA_DIR, "channels.json"),
) as Documents<ChannelsRevision> | null;
const familiesDoc = readConfig(
  join(SCHEMA_DIR, "families.json"),
) as Documents<FamiliesRevision> | null;

if (
  !index ||
  !messageSchema ||
  !structSchema ||
  !protocolSchema ||
  !channelsSchema ||
  !vectorSchema ||
  !familiesSchema ||
  !protocolDoc ||
  !channelsDoc ||
  !familiesDoc
) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

const ajv = new Ajv({ strict: true, allErrors: true });
ajv.addSchema(messageSchema);
const validateMessage = ajv.getSchema(messageSchema.$id);
if (validateMessage === undefined) {
  throw new Error(
    `the message meta-schema ${messageSchema.$id} did not compile`,
  );
}
const validateStruct = ajv.compile(structSchema);
const validateProtocol = ajv.compile(protocolSchema);
const validateChannels = ajv.compile(channelsSchema);
const validateVector = ajv.compile(vectorSchema);
const validateFamilies = ajv.compile(familiesSchema);

// Key order is not part of a value, so compare with it settled.
function canonical(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return `[${value.map((item: unknown) => canonical(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Readonly<Record<string, unknown>>;
    return `{${Object.keys(record)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(record[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const MULTI_BYTE = new Set([
  "u16",
  "i16",
  "u32",
  "i32",
  "u64",
  "i64",
  "f32",
  "f64",
]);

// Which fields would read a byte order the revision never declared.
function needingOrder(
  fields: readonly FieldLike[] | undefined,
  structs: ReadonlyMap<string, StructDoc>,
  seen: ReadonlySet<string> = new Set(),
): string[] {
  const found: string[] = [];
  for (const field of fields ?? []) {
    if (field.endian) continue;
    if (MULTI_BYTE.has(field.type ?? "")) {
      found.push(field.name);
    } else if (field.type === "array" && field.items) {
      found.push(...needingOrder([field.items], structs, seen));
    } else if (field.type === "struct" && !seen.has(field.struct ?? "")) {
      const definition = structs.get(field.struct ?? "");
      if (definition) {
        found.push(
          ...needingOrder(
            definition.fields,
            structs,
            new Set([...seen, field.struct ?? ""]),
          ),
        );
      }
    }
  }
  return found;
}

type Note = (
  path: string,
  absent: boolean,
  rule: Presence,
  scope: Readonly<Record<string, unknown>>,
) => void;

const asRecord = (value: unknown): Readonly<Record<string, unknown>> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;

// Every presence rule a payload met, wherever it sits.
function walkPresence(
  fields: readonly FieldLike[] | undefined,
  given: unknown,
  structs: ReadonlyMap<string, StructDoc>,
  prefix: string,
  note: Note,
  seen: ReadonlySet<string> = new Set(),
): void {
  const values = asRecord(given);
  for (const field of fields ?? []) {
    if (!values || !(field.name in values)) continue;
    const value = values[field.name];
    const path = prefix ? `${prefix}.${field.name}` : field.name;
    if (field.present) note(path, value === null, field.present, values);
    if (value === null || value === undefined) continue;
    if (field.type === "record") {
      walkPresence(field.fields, value, structs, path, note, seen);
    } else if (field.type === "struct" && !seen.has(field.struct ?? "")) {
      const definition = structs.get(field.struct ?? "");
      if (definition) {
        walkPresence(
          definition.fields,
          value,
          structs,
          `struct:${field.struct}`,
          note,
          new Set([...seen, field.struct ?? ""]),
        );
      }
    } else if (field.type === "array" && Array.isArray(value)) {
      // Items share one rule, so one item meeting it counts for the list.
      const items = field.items;
      if (items === undefined) continue;
      for (const item of value as readonly unknown[]) {
        walkPresence(
          [items],
          { [items.name]: item },
          structs,
          path,
          note,
          seen,
        );
      }
    }
  }
}

function needingKey(
  fields: readonly FieldLike[] | undefined,
  structs: ReadonlyMap<string, StructDoc>,
  seen: ReadonlySet<string> = new Set(),
): string[] {
  const found: string[] = [];
  for (const field of fields ?? []) {
    if (field.enciphered) found.push(field.name);
    if (field.type === "array" && field.items) {
      found.push(...needingKey([field.items], structs, seen));
    }
    if (field.type === "struct" && !seen.has(field.struct ?? "")) {
      const definition = structs.get(field.struct ?? "");
      if (definition) {
        found.push(
          ...needingKey(
            definition.fields,
            structs,
            new Set([...seen, field.struct ?? ""]),
          ),
        );
      }
    }
  }
  return found;
}

const report = (
  where: string,
  errors: readonly ErrorObject[] | null | undefined,
): void => {
  for (const error of errors ?? []) {
    const detail =
      error.params && Object.keys(error.params).length
        ? ` ${JSON.stringify(error.params)}`
        : "";
    fail(where, `${error.instancePath || "/"} ${error.message}${detail}`);
  }
};

// A $schema pointer is a convenience for editors, not part of a definition.
const withoutPointer = (doc: unknown): Record<string, unknown> => {
  const copy: Record<string, unknown> = { ...asRecord(doc) };
  delete copy["$schema"];
  return copy;
};

const protocolIsValid = validateProtocol(withoutPointer(protocolDoc));
if (!protocolIsValid) {
  report("schema/protocol.json", validateProtocol.errors);
}
const familiesAreValid = validateFamilies(withoutPointer(familiesDoc));
if (!familiesAreValid) {
  report("schema/families.json", validateFamilies.errors);
}
const channelsAreValid = validateChannels(withoutPointer(channelsDoc));
if (!channelsAreValid) {
  report("schema/channels.json", validateChannels.errors);
}

if (protocolIsValid) {
  checkRevisions(protocolDoc.revisions ?? [], "schema/protocol.json");
}
if (channelsAreValid) {
  checkRevisions(channelsDoc.revisions ?? [], "schema/channels.json");
}
checkNotes(protocolDoc, "schema/protocol.json");
checkNotes(channelsDoc, "schema/channels.json");
checkNotes(familiesDoc, "schema/families.json");

// How far the specification reaches. A packet header is the floor everything
// else stands on, so nothing is described past the last version one covers.
const specEnd = (protocolDoc.revisions ?? []).some((r) => !r.until)
  ? undefined
  : (protocolDoc.revisions ?? [])
      .map((r) => r.until ?? "")
      .sort(compareVersions)
      .pop();

// The definition of a channel, at a version.
const channelAt = (name: string, revision: Ranged): ChannelDef | null => {
  for (const r of channelsDoc.revisions ?? []) {
    if (!rangesOverlap(r, revision)) continue;
    const found = (r.channels ?? []).find((c) => c.name === name);
    if (found) return found;
  }
  return null;
};

// The definition of a family, at a version.
const familyDefAt = (
  name: string | undefined,
  revision: Ranged,
): FamilyDef | null => {
  for (const r of familiesDoc.revisions ?? []) {
    if (!rangesOverlap(r, revision)) continue;
    const found = (r.families ?? []).find((f) => f.name === name);
    if (found) return found;
  }
  return null;
};

// The values a family's plain command field can hold: what its width allows,
// less anything the family keeps for framing.
const plainRange = (
  family: FamilyDef,
): { max: number; kept: Set<number> } | null => {
  const spec = family.command;
  if (!spec) return null;
  const field = family.header.find((f) => f.name === spec.field);
  const bits = field && SCALAR_BITS[field.type ?? ""];
  if (!bits) return null;
  const kept = new Set(spec.reserved ?? []);
  if (spec.escape !== undefined) kept.add(spec.escape);
  return { max: 2 ** bits - 1, kept };
};

// Whether an identifier travels in the plain field or behind the escape.
const isPlain = (family: FamilyDef, command: number): boolean => {
  const range = plainRange(family);
  if (!range) return true;
  return command <= range.max && !range.kept.has(command);
};

// The value a header carries that identifies a message.
// A family with no command field numbers its one message 0.
const effectiveCommand = (family: FamilyDef, values: Values): Value => {
  const spec = family.command;
  if (!spec) return 0;
  const plain = values[spec.field ?? ""];
  if (spec.escape !== undefined && plain === spec.escape) {
    return values[spec.extendedField ?? ""] ?? null;
  }
  return plain ?? null;
};

if (familiesAreValid) {
  checkRevisions(familiesDoc.revisions ?? [], "schema/families.json");
}
for (const [urn, file] of Object.entries(index.schemas)) {
  checkNotes(meta[urn], join(META, file));
}
checkNotes(index, join(META, "index.json"));

// A channel name is how a message reaches its family, so two
// definitions of one name at one version make every message on it undecidable.
(channelsDoc.revisions ?? []).forEach((revision, index) => {
  const names = new Set<string>();
  const ids = new Set<number>();
  for (const channel of revision.channels ?? []) {
    if (names.has(channel.name)) {
      fail(
        `schema/channels.json revision ${index}`,
        `channel "${channel.name}" is defined twice`,
      );
    }
    if (ids.has(channel.id)) {
      fail(
        `schema/channels.json revision ${index}`,
        `channel id ${channel.id} is claimed twice`,
      );
    }
    if (channel.family && !familyDefAt(channel.family, revision)) {
      fail(
        `schema/channels.json revision ${index}`,
        `channel "${channel.name}" carries family "${channel.family}", which is defined nowhere across the range this revision covers`,
      );
    }
    names.add(channel.name);
    ids.add(channel.id);
  }
});

// A message revision spans a range, and a channel has to exist across all of
// it, not merely where it starts.
const channelMissingFor = (
  messageRevision: Ranged,
  name: string,
): string | null => {
  const overlapping = (channelsDoc.revisions ?? []).filter((r) =>
    rangesOverlap(r, messageRevision),
  );
  if (overlapping.length === 0) return "is defined nowhere";
  const absent = overlapping.filter(
    (r) => !(r.channels ?? []).some((c) => c.name === name),
  );
  const [first] = absent;
  return first ? `is not defined from ${first.from}` : null;
};

// Structs first: messages reference them.
const structNames = new Set<string>();
const structs = new Map<string, StructDoc>();
const structFiles: { path: string; doc: StructDoc }[] = [];
const openStructs = new Set<string>();
for (const file of listJson("types")) {
  let parsed: unknown;
  try {
    parsed = readJson(file.path);
  } catch (error) {
    fail(file.path, `not valid JSON: ${messageOf(error)}`);
    continue;
  }
  if (!validateStruct(parsed)) {
    report(file.path, validateStruct.errors);
    continue;
  }
  const doc = parsed as StructDoc;
  if (basename(file.name, ".json") !== doc.struct) {
    fail(
      file.path,
      `file name does not match struct identity "${doc.struct}"`,
    );
  }
  checkNotes(doc, file.path);
  structNames.add(doc.struct);
  structs.set(doc.struct, doc);
  structFiles.push({ path: file.path, doc });
}
for (const { path, doc } of structFiles) {
  const seen = checkFields(doc.fields, new Map(), structNames, path);
  if (seen.has("__open")) openStructs.add(doc.struct);
}

let growing = true;
while (growing) {
  growing = false;
  for (const { doc } of structFiles) {
    if (openStructs.has(doc.struct)) continue;
    const last = doc.fields[doc.fields.length - 1];
    if (
      last?.type === "struct" &&
      last.size === undefined &&
      openStructs.has(last.struct ?? "")
    ) {
      openStructs.add(doc.struct);
      growing = true;
    }
  }
}

// What the codec reads a struct as.
const structFields = new Map<string, readonly Field[]>(
  [...structs].map(([name, doc]) => [name, doc.fields as readonly Field[]]),
);

if (familiesAreValid) {
  (familiesDoc.revisions ?? []).forEach((revision, index) => {
    const at = `schema/families.json revision ${index}`;
    const names = new Set<string>();
    for (const family of revision.families ?? []) {
      if (names.has(family.name)) {
        fail(at, `family "${family.name}" is defined twice`);
      }
      names.add(family.name);
      const seen = checkFields(
        family.header,
        new Map(),
        structNames,
        at,
        openStructs,
      );
      const spec = family.command;
      if (!spec) continue;
      const declared = new Set(family.header.map((f) => f.name));
      if (!declared.has(spec.field ?? "")) {
        fail(
          at,
          `family "${family.name}" names "${spec.field}" as its command, which its header does not carry`,
        );
      }
      if (spec.escape !== undefined && spec.extendedField === undefined) {
        fail(
          at,
          `family "${family.name}" reserves ${spec.escape} as an escape without saying which field carries the identifier instead`,
        );
      }
      if (
        spec.extendedField !== undefined &&
        !declared.has(spec.extendedField)
      ) {
        fail(
          at,
          `family "${family.name}" names "${spec.extendedField}" as its wider identifier, which its header does not carry`,
        );
      }
      if (seen.has("__open")) {
        fail(
          at,
          `family "${family.name}" has a header running to the end of the payload, leaving no room for a body`,
        );
      }
      // A header reads multi byte fields, so it needs an order established
      // across every range it applies to.
      const bare = needingOrder(family.header, structs);
      if (bare.length > 0) {
        for (const protocolRevision of protocolDoc.revisions ?? []) {
          if (!rangesOverlap(protocolRevision, revision)) continue;
          if (protocolRevision.endian) continue;
          fail(
            at,
            `family "${family.name}" reads ${bare.map((n) => `"${n}"`).join(", ")} across a range from ${protocolRevision.from}, where no byte order is established`,
          );
        }
      }
    }
  });
}

// The packet header uses the same field vocabulary, so it gets the same walk.
(protocolIsValid ? (protocolDoc.revisions ?? []) : []).forEach(
  (revision, index) => {
    if (!revision.transport?.header) return;
    const at = `schema/protocol.json revision ${index} header`;
    const seen = checkFields(
      revision.transport.header,
      new Map(),
      structNames,
      at,
      openStructs,
    );
    if (seen.has("__open")) {
      fail(
        at,
        "runs to the end of the datagram, leaving no room for a payload",
      );
    }
  },
);

const usedStructs = (fields: readonly FieldLike[] | undefined): string[] => {
  const found: string[] = [];
  for (const field of fields ?? []) {
    if (field.type === "struct") found.push(field.struct ?? "");
    if (field.type === "array" && field.items)
      found.push(...usedStructs([field.items]));
  }
  return found;
};
for (const { path, doc } of structFiles) {
  const trail = [doc.struct];
  const walk = (name: string): boolean => {
    for (const next of usedStructs(structs.get(name)?.fields)) {
      if (trail.includes(next)) {
        fail(
          path,
          `contains itself through ${[...trail, next].join(" then ")}, so it describes a payload with no end`,
        );
        return true;
      }
      trail.push(next);
      if (walk(next)) return true;
      trail.pop();
    }
    return false;
  };
  walk(doc.struct);
}

const messages: { where: string; doc: MessageDoc }[] = [];
for (const file of listJson("messages")) {
  let parsed: unknown;
  try {
    parsed = readJson(file.path);
  } catch (error) {
    fail(file.path, `not valid JSON: ${messageOf(error)}`);
    continue;
  }
  if (!validateMessage(parsed)) {
    report(file.path, validateMessage.errors);
    continue;
  }
  const doc = parsed as MessageDoc;
  if (basename(file.name, ".json") !== doc.message) {
    fail(
      file.path,
      `file name does not match message identity "${doc.message}"`,
    );
  }
  checkNotes(doc, file.path);
  messages.push({ where: file.path, doc });
}

for (const { where, doc } of messages) {
  checkRevisions(doc.revisions, where);
  doc.revisions.forEach((revision, index) => {
    const at = `${where} revision ${index}`;
    const missing = channelMissingFor(revision, revision.channel);
    if (missing) {
      fail(
        at,
        `channel "${revision.channel}" ${missing} across the range this revision covers`,
      );
    }

    // A revision with no end runs as far as the specification itself does,
    // rather than for ever, so recording one costs no boundary to repeat.
    const reach: Ranged = revision.until
      ? revision
      : { ...revision, until: specEnd };

    // Each of the three documents has to account for the whole range, not
    // merely disagree with none of it.
    for (const [what, revisions] of [
      ["protocol", protocolDoc.revisions ?? []],
      ["channel", channelsDoc.revisions ?? []],
      ["family", familiesDoc.revisions ?? []],
    ] as const) {
      const gap = uncoveredIn(revisions, reach);
      if (gap !== null) {
        fail(at, `covers ${gap} onward, which no ${what} revision describes`);
      }
    }
    checkFields(revision.fields, new Map(), structNames, at, openStructs);

    // A message body begins where its family's header ends, so the two cannot
    // both claim a name, and the family has to be able to carry the command.
    const channel = channelAt(revision.channel, revision);
    const family = channel && familyDefAt(channel.family, revision);
    if (family) {
      const carried = new Set(family.header.map((f) => f.name));
      for (const field of revision.fields ?? []) {
        if (carried.has(field.name)) {
          fail(
            at,
            `field "${field.name}" repeats a name the "${family.name}" header already carries`,
          );
        }
      }
      if (family.command === undefined && revision.command !== 0) {
        fail(
          at,
          `command ${revision.command} names a message of the "${family.name}" family, which carries no command and numbers its one message 0`,
        );
      }
      const spec: CommandSpec = family.command ?? {};
      const widest = spec.extendedField === undefined ? 255 : 65535;
      if (revision.command > widest) {
        fail(
          at,
          `command ${revision.command} does not fit what the "${family.name}" family can carry`,
        );
      }
      const kept = new Set(spec.reserved ?? []);
      if (spec.escape !== undefined) kept.add(spec.escape);
      if (kept.has(revision.command)) {
        fail(
          at,
          `command ${revision.command} is reserved for framing in the "${family.name}" family`,
        );
      }
    }

    // A channel a message also travels on has to exist, has to be a channel
    // it is not already on, and has to number its messages the same way, or
    // the command value would not mean the same thing there.
    const alsoSeen = new Set<string>();
    for (const other of revision.alsoOn ?? []) {
      const gone = channelMissingFor(revision, other.channel);
      if (gone) {
        fail(
          at,
          `also travels on channel "${other.channel}", which ${gone} across the range this revision covers`,
        );
        continue;
      }
      if (other.channel === revision.channel || alsoSeen.has(other.channel)) {
        fail(at, `names channel "${other.channel}" twice`);
        continue;
      }
      alsoSeen.add(other.channel);
      const there = channelAt(other.channel, revision);
      if (channel && there && channel.family !== there.family) {
        fail(
          at,
          `also travels on channel "${other.channel}", which carries the "${there.family}" numbering rather than the "${channel.family}" numbering of "${revision.channel}"`,
        );
      }
    }

    const bare = needingOrder(revision.fields, structs);
    if (bare.length > 0) {
      for (const protocolRevision of protocolDoc.revisions ?? []) {
        if (!rangesOverlap(protocolRevision, revision)) continue;
        if (protocolRevision.endian) continue;
        fail(
          at,
          `reads ${bare.map((n) => `"${n}"`).join(", ")} across a range from ${protocolRevision.from}, where no byte order is established`,
        );
      }
    }
  });
}

// Which family a channel carries, at a version.
const familyAt = (channelName: string, revision: Ranged): string | null => {
  for (const r of channelsDoc.revisions ?? []) {
    if (!rangesOverlap(r, revision)) continue;
    const found = (r.channels ?? []).find((c) => c.name === channelName);
    if (found) return found.family ?? null;
  }
  return null;
};

// One command value cannot mean two things in the same family, in the same
// direction, at the same time.
const claims = messages.flatMap(({ where, doc }) =>
  doc.revisions.flatMap((revision) =>
    [revision.channel, ...(revision.alsoOn ?? []).map((o) => o.channel)].map(
      (channel) => ({ where, message: doc.message, revision, channel }),
    ),
  ),
);

// One pair of messages is reported once, however many of their channels clash.
const reportedCollisions = new Set<string>();

for (let i = 0; i < claims.length; i += 1) {
  for (let j = i + 1; j < claims.length; j += 1) {
    const a = claims[i];
    const b = claims[j];
    if (a === undefined || b === undefined) continue;
    if (a.message === b.message) continue;
    if (a.revision.command !== b.revision.command) continue;
    if (!rangesOverlap(a.revision, b.revision)) continue;
    const familyA = familyAt(a.channel, a.revision);
    const familyB = familyAt(b.channel, b.revision);
    if (familyA === null || familyB === null || familyA !== familyB) continue;
    if (!directionsOverlap(a.revision.direction, b.revision.direction))
      continue;
    const where =
      a.channel === b.channel
        ? `on channel "${a.channel}"`
        : `across channels "${a.channel}" and "${b.channel}", which share the "${familyA}" numbering`;
    const pair = `${a.revision.command} ${[a.message, b.message].sort().join(" ")}`;
    if (reportedCollisions.has(pair)) continue;
    reportedCollisions.add(pair);
    fail(
      a.where,
      `command ${a.revision.command} collides with ${b.message} ${where}`,
    );
  }
}

// Vectors. A subject says what is being checked.
const byMessage = new Map(messages.map(({ doc }) => [doc.message, doc]));
const covered = new Set<string>();
const transportCovered = new Set<string>();
// Structs a vector reads on their own.
const structCovered = new Set<string>();
// Which presence rules any vector has actually exercised, and which way.
interface Exercised {
  present: boolean;
  absent: boolean;
  readonly members: Set<number>;
}
const exercised = new Map<string, Exercised>();
// What a message vector decoded to, so an algorithm can only read that.
const decoded = new Map<string, Values>();
const algorithmsSeen = new Set<string>();
const pendingAlgorithms: { path: string; doc: VectorDoc }[] = [];
const pascalFromKebab = (name: string): string =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const hexPairs = (text: string): number | null => {
  const stripped = text.replace(/\s+/g, "");
  return stripped.length % 2 === 0 ? stripped.length / 2 : null;
};

const equalBytes = (a: Uint8Array, b: Uint8Array): boolean =>
  hex(a) === hex(b);

const vectorFiles: { path: string; trail: string[] }[] = [];
const walkVectors = (at: string, trail: string[]): void => {
  // Sorted, so problems come out in the same order on every runtime.
  const entries = readdirSync(at, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  for (const entry of entries) {
    const here = join(at, entry.name);
    if (entry.isDirectory()) {
      walkVectors(here, [...trail, entry.name]);
    } else if (entry.name.endsWith(".json")) {
      vectorFiles.push({ path: here, trail });
    }
  }
};

let vectorCount = 0;
if (existsSync(VECTOR_DIR)) {
  walkVectors(VECTOR_DIR, []);
  {
    for (const { path, trail } of vectorFiles) {
      if (trail.length !== 1) {
        fail(
          path,
          trail.length === 0
            ? "sits directly under the vector directory, and a vector belongs in a directory naming its subject"
            : `sits ${trail.length} directories deep, and a vector belongs one directory below the vector directory`,
        );
        continue;
      }
      const dir = { name: trail[0] ?? "" };

      let parsed: unknown;
      try {
        parsed = readJson(path);
      } catch (error) {
        fail(path, `not valid JSON: ${messageOf(error)}`);
        continue;
      }
      vectorCount += 1;
      if (!validateVector(withoutPointer(parsed))) {
        report(path, validateVector.errors);
        continue;
      }
      const doc = parsed as VectorDoc;
      checkNotes(doc, path, "", true);

      for (const key of ["bytes", "key", "plaintext", "ciphertext"] as const) {
        const text = doc[key];
        if (text === undefined) continue;
        const pairs = hexPairs(text);
        if (pairs === null) {
          fail(path, `${key} has an odd number of hexadecimal digits`);
        } else if (pairs === 0) {
          fail(path, `${key} holds no bytes`);
        }
      }

      if (doc.subject === "algorithm") {
        if (dir.name !== "algorithm") {
          fail(path, `sits under "${dir.name}" but its subject is algorithm`);
          continue;
        }
        pendingAlgorithms.push({ path, doc });
        continue;
      }

      if (doc.subject === "cipher") {
        if (dir.name !== "cipher") {
          fail(path, `sits under "${dir.name}" but its subject is cipher`);
        }
        const key = unhex(doc.key ?? "");
        // A cipher vector names no version, so it answers to every key size
        // any revision records.
        const sizes = new Set(
          (protocolDoc.revisions ?? [])
            .map((r) => r.cipher?.keySize)
            .filter((n): n is number => n !== undefined),
        );
        if (sizes.size > 0 && !sizes.has(key.length)) {
          fail(
            path,
            `carries a ${key.length} byte key, and the recorded sizes are ${[...sizes].join(", ")}`,
          );
        }
        const plaintext = unhex(doc.plaintext ?? "");
        const ciphertext = unhex(doc.ciphertext ?? "");
        if (plaintext.length !== ciphertext.length) {
          fail(
            path,
            `enciphers ${plaintext.length} bytes into ${ciphertext.length}, and the cipher does not change length`,
          );
        } else {
          let written: Uint8Array;
          let read: Uint8Array;
          try {
            const cipher = new Blowfish(key);
            written = cipher.encipher(plaintext);
            read = cipher.decipher(ciphertext);
          } catch (error) {
            // Nothing below can be checked without the algorithm, so stop
            // rather than report every vector as a failure of its own.
            console.error(`Blowfish is unavailable: ${messageOf(error)}`);
            process.exit(1);
          }
          if (!equalBytes(written, ciphertext)) {
            fail(
              path,
              `enciphers to ${hex(written)}, and the vector says ${hex(ciphertext)}`,
            );
          }
          if (!equalBytes(read, plaintext)) {
            fail(
              path,
              `deciphers to ${hex(read)}, and the vector says ${hex(plaintext)}`,
            );
          }
        }
        continue;
      }

      if (!protocolIsValid) {
        // Every layout below is read out of a file the meta-schema rejected,
        // so the errors already reported are the ones worth reading.
        continue;
      }
      const version = doc.version ?? "";
      const protocolRevision = (protocolDoc.revisions ?? []).find((r) =>
        covers(r, version),
      );
      if (!protocolRevision) {
        fail(path, `version ${version} falls outside every protocol revision`);
        continue;
      }

      let defined: readonly FieldLike[];
      let claim: {
        family: FamilyDef;
        command: number;
        message: string;
        revision: MessageRevision;
      } | null = null;
      if (doc.subject === "transport") {
        if (dir.name !== "transport") {
          fail(path, `sits under "${dir.name}" but its subject is transport`);
        }
        defined = protocolRevision.transport?.header ?? [];
        transportCovered.add(protocolRevision.from);
      } else if (doc.subject === "struct") {
        if (pascalFromKebab(dir.name) !== doc.struct) {
          fail(
            path,
            `sits under "${dir.name}" but names struct "${doc.struct}"`,
          );
        }
        const definition = structs.get(doc.struct ?? "");
        if (!definition) {
          fail(path, `names struct "${doc.struct}", which has no definition`);
          continue;
        }
        defined = definition.fields;
        structCovered.add(definition.struct);
      } else {
        if (pascalFromKebab(dir.name) !== doc.message) {
          fail(
            path,
            `sits under "${dir.name}" but names message "${doc.message}"`,
          );
        }
        const message = byMessage.get(doc.message ?? "");
        if (!message) {
          fail(
            path,
            `names message "${doc.message}", which has no definition`,
          );
          continue;
        }
        const revision = message.revisions.find((r) => covers(r, version));
        if (!revision) {
          fail(
            path,
            `version ${version} falls outside every revision of ${message.message}`,
          );
          continue;
        }
        covered.add(`${message.message}@${revision.from}`);
        // Where a revision names more than one channel, each has to have a
        // payload behind it, and a vector says which one it arrived on.
        if (doc.channel !== undefined) {
          const named = [
            revision.channel,
            ...(revision.alsoOn ?? []).map((o) => o.channel),
          ];
          if (!named.includes(doc.channel)) {
            fail(
              path,
              `arrived on channel "${doc.channel}", which ${message.message} does not travel on`,
            );
          }
          covered.add(`${message.message}@${revision.from}@${doc.channel}`);
        }
        const channel = channelAt(revision.channel, revision);
        const family = channel && familyDefAt(channel.family, revision);
        if (!family) {
          fail(
            path,
            `travels on channel "${revision.channel}", whose family is defined nowhere for ${version}`,
          );
          continue;
        }
        // A vector covers every byte of the payload, header included.
        defined = [...family.header, ...revision.fields];
        claim = {
          family,
          command: revision.command,
          message: message.message,
          revision,
        };
      }

      const fields = doc.fields ?? {};
      const names = new Set(defined.map((f) => f.name));
      for (const name of Object.keys(fields)) {
        if (!names.has(name)) {
          fail(
            path,
            `decodes a field "${name}" that the revision does not define`,
          );
        }
      }
      // A field a presence rule leaves out is written as null rather than omitted.
      for (const field of defined) {
        if (!(field.name in fields)) {
          fail(path, `does not decode the field "${field.name}"`);
        } else if (fields[field.name] === null && !field.present) {
          fail(
            path,
            `writes "${field.name}" as absent, but no presence rule governs it`,
          );
        }
      }

      if (!protocolRevision.endian) {
        const bare = needingOrder(defined, structs);
        if (bare.length > 0) {
          fail(
            path,
            `reads ${bare.map((n) => `"${n}"`).join(", ")} at a byte order revision ${protocolRevision.from} does not declare`,
          );
          continue;
        }
      }

      // The two claims the vector makes, rather than an assertion nobody reads.
      const endian = protocolRevision.endian ?? "little";
      const payload = unhex(doc.bytes ?? "");
      // A payload is covered from its first byte: a message opens with the
      // header its family carries, and a transport vector with the packet
      // header itself.
      const start = 0;
      const layout = defined as readonly Field[];
      try {
        const sealed = needingKey(defined, structs);
        let cipher: Cipher | undefined;
        if (sealed.length > 0) {
          if (doc.key === undefined) {
            fail(
              path,
              `records ${sealed.map((n) => `"${n}"`).join(", ")}, which travels enciphered, so the vector needs the key that reads it`,
            );
            continue;
          }
          cipher = new Blowfish(unhex(doc.key));
        } else if (doc.key !== undefined) {
          fail(
            path,
            "carries a key, and no field of this message travels enciphered",
          );
          continue;
        }
        const context = {
          structs: structFields,
          endian,
          ...(cipher === undefined ? {} : { cipher }),
        };
        const read = decodeFields(layout, payload, start, context);
        if (doc.subject !== "transport" && read.offset !== payload.length) {
          fail(
            path,
            `decodes ${read.offset} of ${payload.length} bytes, leaving ${payload.length - read.offset} unread`,
          );
        }
        if (claim) {
          const carried = effectiveCommand(claim.family, read.values);
          if (carried !== claim.command) {
            fail(
              path,
              `carries command ${String(carried)}, and ${claim.message} is command ${claim.command} at this version`,
            );
          } else {
            const spec: CommandSpec = claim.family.command ?? {};
            const wantsPlain = isPlain(claim.family, claim.command);
            const usedEscape =
              spec.escape !== undefined &&
              read.values[spec.field ?? ""] === spec.escape;
            if (wantsPlain && usedEscape) {
              fail(
                path,
                `reaches command ${claim.command} through the escape, and the "${claim.family.name}" header carries that value directly`,
              );
            }
            if (!wantsPlain && !usedEscape) {
              fail(
                path,
                `carries command ${claim.command} directly, and the "${claim.family.name}" header reaches that value only through the escape`,
              );
            }
          }
        }
        if (claim || doc.subject === "struct") {
          const owner = claim;
          const note: Note = (at, absent, rule, scope) => {
            const key = at.startsWith("struct:")
              ? `#${at}`
              : `${owner?.message}@${owner?.revision.from}#${at}`;
            const seenSoFar = exercised.get(key) ?? {
              present: false,
              absent: false,
              members: new Set<number>(),
            };
            if (absent) seenSoFar.absent = true;
            else seenSoFar.present = true;
            // A rule satisfied by any one of a set is only exercised for the
            // members some vector actually carried.
            if (!absent && Array.isArray(rule.equals)) {
              const [head = "", run] = rule.when.split(".");
              const carried =
                run === undefined ? scope[head] : asRecord(scope[head])?.[run];
              if (carried !== undefined && carried !== null) {
                seenSoFar.members.add(Number(carried));
              }
            }
            exercised.set(key, seenSoFar);
          };
          if (owner) {
            walkPresence(
              owner.revision.fields,
              read.values,
              structs,
              "",
              note,
            );
          } else {
            walkPresence(
              defined,
              read.values,
              structs,
              `struct:${doc.struct}`,
              note,
              new Set([doc.struct ?? ""]),
            );
          }
        }
        if (doc.subject === "message") {
          decoded.set(`${dir.name}/${basename(path, ".json")}`, read.values);
        }
        const expected = canonical(fields);
        const actual = canonical(read.values);
        if (expected !== actual) {
          fail(
            path,
            `bytes decode to ${actual}, and the vector says ${expected}`,
          );
        } else {
          const written = encodeFields(layout, fields, context);
          const wanted = payload.subarray(start, read.offset);
          if (!equalBytes(written, wanted)) {
            fail(
              path,
              `fields encode to ${hex(written)}, and the bytes are ${hex(wanted)}`,
            );
          }
        }
      } catch (error) {
        if (!(error instanceof CodecError)) throw error;
        fail(path, `cannot be decoded: ${error.message}`);
      }
    }
  }
}

for (const { path, doc } of pendingAlgorithms) {
  const name = doc.algorithm ?? "";
  const run = ALGORITHMS[name];
  if (!run) {
    fail(path, `names algorithm "${name}", which nothing implements`);
    continue;
  }
  algorithmsSeen.add(name);
  const source = decoded.get(doc.input?.vector ?? "");
  if (!source) {
    fail(
      path,
      `reads "${doc.input?.vector}", which is not a message vector that decoded`,
    );
    continue;
  }
  let input: Value | undefined = source;
  for (const part of (doc.input?.field ?? "").split(".")) {
    if (Array.isArray(input)) {
      input = (input as readonly Value[])[Number(part)];
    } else {
      const record = asRecord(input);
      input =
        record === null ? undefined : (record[part] as Value | undefined);
    }
  }
  if (input === undefined) {
    fail(
      path,
      `reads "${doc.input?.field}" of "${doc.input?.vector}", which holds no such field`,
    );
    continue;
  }
  let got: string | undefined;
  try {
    got = canonical(run(input));
  } catch (error) {
    fail(path, `could not be run: ${messageOf(error)}`);
    continue;
  }
  const want = canonical(doc.output);
  if (got !== want) {
    fail(path, `produces ${got}, and the vector says ${want}`);
  }
}

for (const name of Object.keys(ALGORITHMS)) {
  if (!algorithmsSeen.has(name)) {
    fail(
      "scripts/algorithms.ts",
      `algorithm "${name}" has no vector, so nothing checks it`,
    );
  }
}

if (protocolIsValid) {
  for (const revision of protocolDoc.revisions ?? []) {
    if (!revision.transport?.header) continue;
    if (!transportCovered.has(revision.from)) {
      fail(
        "schema/protocol.json",
        `revision ${revision.from} records a packet header with no vector, so nothing checks it against a recorded datagram`,
      );
    }
  }
}

// Structs some message carries, so its vectors evidence their rules.
const carriedStructs = new Set<string>();
type Ruled = [path: string, unseen: Presence["unseen"], rule: Presence];
// Every presence rule under fields, with the side a rule says nothing shows.
const presenceRules = (
  fields: readonly FieldLike[],
  prefix: string,
): Ruled[] => {
  const ruled: Ruled[] = [];
  const collect = (
    fields: readonly FieldLike[] | undefined,
    prefix: string,
    seenStructs: ReadonlySet<string>,
  ): void => {
    for (const field of fields ?? []) {
      const path = prefix ? `${prefix}.${field.name}` : field.name;
      if (field.present)
        ruled.push([path, field.present.unseen, field.present]);
      if (field.type === "record") collect(field.fields, path, seenStructs);
      else if (
        field.type === "struct" &&
        !seenStructs.has(field.struct ?? "")
      ) {
        carriedStructs.add(field.struct ?? "");
        const d = structs.get(field.struct ?? "");
        if (d)
          collect(
            d.fields,
            `struct:${field.struct}`,
            new Set([...seenStructs, field.struct ?? ""]),
          );
      } else if (field.type === "array" && field.items) {
        collect([field.items], path, seenStructs);
      }
    }
  };
  collect(
    fields,
    prefix,
    new Set(prefix.startsWith("struct:") ? [prefix.slice(7)] : []),
  );
  return ruled;
};
// Whether vectors met each rule both ways, or as the rule says.
const checkRules = (
  where: string,
  label: string,
  ruled: readonly Ruled[],
  keyOf: (path: string) => string,
): void => {
  for (const [path, unseen, rule] of ruled) {
    const seen = exercised.get(keyOf(path));
    if (!seen) {
      fail(where, `${label} has no vector reaching "${path}" at all`);
      continue;
    }
    // A rule may declare that no capture shows one of its sides. The
    // declaration has to stay true, or it is hiding a vector nobody added.
    const equals = rule.equals;
    if (unseen && seen[unseen]) {
      fail(
        where,
        `${label} says no payload shows "${path}" ${unseen}, and one does`,
      );
    } else if (
      unseen !== "present" &&
      Array.isArray(equals) &&
      equals.some((member) => !seen.members.has(member))
    ) {
      const missing = equals.filter((member) => !seen.members.has(member));
      fail(
        where,
        `${label} has no vector where "${path}" is present with "${rule.when}" ${missing.join(", ")}, so part of its presence rule is unrecorded`,
      );
    } else if (!unseen && (!seen.present || !seen.absent)) {
      fail(
        where,
        `${label} has no vector where "${path}" is ${seen.present ? "absent" : "present"}, so half its presence rule is unrecorded`,
      );
    }
  }
};

for (const { where, doc } of messages) {
  for (const revision of doc.revisions ?? []) {
    // A rule inside a struct belongs to the struct, so any message that
    // carries it can be the one that evidences it.
    checkRules(
      where,
      `revision ${revision.from}`,
      presenceRules(revision.fields, ""),
      (path) =>
        path.startsWith("struct:")
          ? `#${path}`
          : `${doc.message}@${revision.from}#${path}`,
    );
    if (!covered.has(`${doc.message}@${revision.from}`)) {
      fail(
        where,
        `revision ${revision.from} has no vector, so nothing checks its layout against a recorded payload`,
      );
    }
    for (const channel of [
      revision.channel,
      ...(revision.alsoOn ?? []).map((o) => o.channel),
    ]) {
      if (
        (revision.alsoOn ?? []).length > 0 &&
        !covered.has(`${doc.message}@${revision.from}@${channel}`)
      ) {
        fail(
          where,
          `revision ${revision.from} claims channel "${channel}" with no vector that arrived on it`,
        );
      }
    }
  }
}

// A struct no message carries travels on its own, so vectors read it alone.
for (const { path: where, doc } of structFiles) {
  if (carriedStructs.has(doc.struct)) continue;
  if (!structCovered.has(doc.struct)) {
    fail(
      where,
      "no message carries it and no vector reads it on its own, so nothing checks its layout against a recorded payload",
    );
    continue;
  }
  checkRules(
    where,
    `struct ${doc.struct}`,
    presenceRules(doc.fields, `struct:${doc.struct}`),
    (path) => `#${path}`,
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}

console.log(
  `Checked ${messages.length} message(s), ${structNames.size} struct(s) and ${vectorCount} vector(s). No problems.`,
);
