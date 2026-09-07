// Checks the schema files for things JSON Schema cannot express.
//
// JSON Schema validates the shape of a definition. It cannot tell whether a
// channel exists at the version a message claims, whether a struct reference
// resolves, whether a reference points backwards at something countable, or
// whether two revisions claim the same command value over the same versions.
// Those checks live here.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import Ajv from "ajv/dist/2020.js";
import { CodecError, decodeFields, encodeFields } from "./codec.mjs";
import { BLOCK, CipherError, decipher, encipher } from "./cipher.mjs";
import { ALGORITHMS } from "./algorithms.mjs";

const SCHEMA_DIR = "schema";
const META = join(SCHEMA_DIR, "meta");
const VECTOR_DIR = join("conformance", "vectors");

const COUNTABLE = new Set(["u8", "u16", "u32", "u64"]);
const TRUTHY = new Set([...COUNTABLE, "i8", "i16", "i32", "i64"]);
const RESERVED = new Set(["remaining", "terminated"]);
const SCALAR_BITS = {
  u8: 8,
  i8: 8,
  u16: 16,
  i16: 16,
  u32: 32,
  i32: 32,
  u64: 64,
  i64: 64,
};

// Prose carried as data reaches a reader the same way the documents do, and no
// linter reads JSON. Every prose rule is read from the file the documents are
// held to rather than copied here, which would drift.
const STYLES = join("styles", "trueshot");
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const loadRule = (file) => {
  const text = readFileSync(join(STYLES, file), "utf8");
  const message = /^message:\s*"(.+)"\s*$/m.exec(text);
  const nonword = /^nonword:\s*true\s*$/m.test(text);
  // A rule that does not ask to ignore case means the case it wrote.
  const anyCase = /^ignorecase:\s*true\s*$/m.test(text);
  const tokens = text
    .split("\n")
    .map((line) => /^\s*-\s*['"]?(.+?)['"]?\s*$/.exec(line))
    .filter(Boolean)
    .map((match) => match[1]);
  return {
    say: message ? message[1] : file,
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

const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function readConfig(path) {
  try {
    return readJson(path);
  } catch (error) {
    fail(path, `could not be read: ${error.message}`);
    return null;
  }
}

function listJson(dir) {
  const path = join(SCHEMA_DIR, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({ name, path: join(path, name) }));
}

const parseVersion = (text) => text.split(".").map(Number);

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let i = 0; i < 4; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

// Revisions cover [from, until). An absent `until` runs forever.
function rangesOverlap(a, b) {
  const aStartsBeforeBEnds = !b.until || compareVersions(a.from, b.until) < 0;
  const bStartsBeforeAEnds = !a.until || compareVersions(b.from, a.until) < 0;
  return aStartsBeforeBEnds && bStartsBeforeAEnds;
}

const covers = (revision, version) =>
  compareVersions(version, revision.from) >= 0 &&
  (!revision.until || compareVersions(version, revision.until) < 0);

// The first version of a range that no revision in a list accounts for, or
// null where the list covers the range end to end.
function uncoveredIn(revisions, range) {
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
const directionsOverlap = (a, b) =>
  a === b || a === "bidirectional" || b === "bidirectional";

// Every list of revisions holds to the same rules, whatever it describes.
function checkRevisions(revisions, where) {
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
      if (rangesOverlap(revisions[i], revisions[j])) {
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

function checkNotes(value, where, path = "", isVector = false) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
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

// Walks a field list at any depth. `outer` carries the names already read in
// enclosing scopes, so an array element may size itself from an earlier field.
// Bit runs are addressable as parent.bit, which is what a presence rule points
// at.
// A run of bits carries values as a whole field does, so both are read here.
function checkValues(field, at, parent) {
  if (!field.values) return;
  const label = parent ? `"${parent}.${field.name}"` : `"${field.name}"`;
  const bits = field.width ?? SCALAR_BITS[field.type];
  const signed = field.width === undefined && field.type?.startsWith("i");
  const low = signed ? -(2 ** (bits - 1)) : 0;
  const high = signed ? 2 ** (bits - 1) - 1 : 2 ** bits - 1;
  const what = field.width === undefined ? `a ${field.type}` : `${bits} bits`;
  const names = new Set();
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

function checkFields(fields, outer, structNames, at, openStructs = new Set()) {
  const seen = new Map(outer);

  fields.forEach((field, index) => {
    const last = index === fields.length - 1;
    let openEnded = false;

    if (field.enciphered) {
      const width =
        field.type === "bytes" ? field.size : SCALAR_BITS[field.type] / 8;
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
    const checkItemRef = (where, text) => {
      const m =
        /^([a-z][A-Za-z0-9]*)\[([a-z][A-Za-z0-9]*)\](?:\.([a-z][A-Za-z0-9]*))?$/.exec(
          text,
        );
      if (!m) return false;
      const [, list, , run] = m;
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
      } else if (entry.itemName === m[2]) {
        fail(
          at,
          `field "${where}" names "${text}", which is the list it is inside`,
        );
      } else if (
        JSON.stringify(entry.count) !== JSON.stringify(outer.get("__count"))
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

    if (field.present) {
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
        if (!TRUTHY.has(entry.type)) {
          fail(
            at,
            `field "${field.name}" is present when "${target}", which is ${entry.type} and has no truth value`,
          );
        }
        const width = entry.width ?? SCALAR_BITS[entry.type];
        if (field.present.equals !== undefined && width !== undefined) {
          const signed =
            entry.width === undefined && entry.type.startsWith("i");
          const low = signed ? -(2 ** (width - 1)) : 0;
          const high = signed ? 2 ** (width - 1) - 1 : 2 ** width - 1;
          if (field.present.equals < low || field.present.equals > high) {
            fail(
              at,
              `field "${field.name}" is present when "${target}" equals ${field.present.equals}, which ${entry.type} cannot hold`,
            );
          }
        }
      }
    }

    if (field.type === "bits") {
      const declared = field.bits.reduce((total, run) => total + run.width, 0);
      const available = field.size * 8;
      if (declared !== available) {
        fail(
          at,
          `field "${field.name}" declares ${declared} bits across ${field.size} byte(s), which holds ${available}`,
        );
      }
      for (const run of field.bits) {
        const path = `${field.name}.${run.name}`;
        if (seen.has(path)) {
          fail(at, `bit run "${path}" is declared twice`);
        }
        seen.set(path, { type: "u8", width: run.width });
      }
    }

    for (const key of ["count", "size"]) {
      let value = field[key];
      if (value && typeof value === "object") {
        if (checkItemRef(field.name, value.field)) continue;
        const entry = seen.get(value.field);
        if (!entry) {
          fail(
            at,
            `field "${field.name}" ${key} refers to "${value.field}", which is not an earlier field`,
          );
        } else if (!COUNTABLE.has(entry.type)) {
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
      if (!seen.has(value)) {
        fail(
          at,
          `field "${field.name}" ${key} refers to "${value}", which is not an earlier field`,
        );
      } else if (!COUNTABLE.has(seen.get(value).type)) {
        fail(
          at,
          `field "${field.name}" ${key} refers to "${value}", which is ${seen.get(value).type} rather than an unsigned integer`,
        );
      }
    }

    const itemRunsOn =
      field.items?.size === "remaining" ||
      (field.items?.type === "struct" &&
        field.items.size === undefined &&
        openStructs.has(field.items.struct));
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
      if (!structNames.has(field.struct)) {
        fail(
          at,
          `field "${field.name}" refers to struct "${field.struct}", which has no definition`,
        );
      } else if (
        openStructs.has(field.struct) &&
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
      inner.set("__count", field.count);
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
        field.fields,
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
        openStructs.has(field.struct));
    if (endsOpen && last) seen.set("__open", { type: "u8" });
  });

  return seen;
}

const index = readConfig(join(META, "index.json"));
const metaFiles = Object.values(index?.schemas ?? {});
for (const name of readdirSync(META)) {
  if (
    name.endsWith(".json") &&
    name !== "index.json" &&
    !metaFiles.includes(name)
  ) {
    fail(join(META, "index.json"), `does not list ${name}`);
  }
}
const meta = Object.fromEntries(
  Object.entries(index?.schemas ?? {}).map(([urn, file]) => [
    urn,
    readConfig(join(META, file)),
  ]),
);
const messageSchema = meta["urn:trueshot:schema:message"];
const structSchema = meta["urn:trueshot:schema:struct"];
const protocolSchema = meta["urn:trueshot:schema:protocol"];
const channelsSchema = meta["urn:trueshot:schema:channels"];
const vectorSchema = meta["urn:trueshot:schema:vector"];
const familiesSchema = meta["urn:trueshot:schema:families"];
const protocolDoc = readConfig(join(SCHEMA_DIR, "protocol.json"));
const channelsDoc = readConfig(join(SCHEMA_DIR, "channels.json"));
const familiesDoc = readConfig(join(SCHEMA_DIR, "families.json"));

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
const validateStruct = ajv.compile(structSchema);
const validateProtocol = ajv.compile(protocolSchema);
const validateChannels = ajv.compile(channelsSchema);
const validateVector = ajv.compile(vectorSchema);
const validateFamilies = ajv.compile(familiesSchema);

// Key order is not part of a value, so compare with it settled.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
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
function needingOrder(fields, structs, seen = new Set()) {
  const found = [];
  for (const field of fields ?? []) {
    if (field.endian) continue;
    if (MULTI_BYTE.has(field.type)) {
      found.push(field.name);
    } else if (field.type === "array" && field.items) {
      found.push(...needingOrder([field.items], structs, seen));
    } else if (field.type === "struct" && !seen.has(field.struct)) {
      const definition = structs.get(field.struct);
      if (definition) {
        found.push(
          ...needingOrder(
            definition.fields,
            structs,
            new Set([...seen, field.struct]),
          ),
        );
      }
    }
  }
  return found;
}

// Every presence rule a payload met, wherever it sits.
function walkPresence(
  fields,
  values,
  structs,
  prefix,
  note,
  seen = new Set(),
) {
  for (const field of fields ?? []) {
    if (!values || !(field.name in values)) continue;
    const value = values[field.name];
    const path = prefix ? `${prefix}.${field.name}` : field.name;
    if (field.present) note(path, value === null);
    if (value === null || value === undefined) continue;
    if (field.type === "record") {
      walkPresence(field.fields, value, structs, path, note, seen);
    } else if (field.type === "struct" && !seen.has(field.struct)) {
      const definition = structs.get(field.struct);
      if (definition) {
        walkPresence(
          definition.fields,
          value,
          structs,
          `struct:${field.struct}`,
          note,
          new Set([...seen, field.struct]),
        );
      }
    } else if (field.type === "array" && Array.isArray(value)) {
      // Items share one rule, so one item meeting it counts for the list.
      for (const item of value) {
        walkPresence(
          [field.items],
          { [field.items.name]: item },
          structs,
          path,
          note,
          seen,
        );
      }
    }
  }
}

function needingKey(fields, structs, seen = new Set()) {
  const found = [];
  for (const field of fields ?? []) {
    if (field.enciphered) found.push(field.name);
    if (field.type === "array" && field.items) {
      found.push(...needingKey([field.items], structs, seen));
    }
    if (field.type === "struct" && !seen.has(field.struct)) {
      const definition = structs.get(field.struct);
      if (definition) {
        found.push(
          ...needingKey(
            definition.fields,
            structs,
            new Set([...seen, field.struct]),
          ),
        );
      }
    }
  }
  return found;
}

const report = (where, errors) => {
  for (const error of errors) {
    const detail =
      error.params && Object.keys(error.params).length
        ? ` ${JSON.stringify(error.params)}`
        : "";
    fail(where, `${error.instancePath || "/"} ${error.message}${detail}`);
  }
};

// A $schema pointer is a convenience for editors, not part of a definition.
const withoutPointer = (doc) => {
  const copy = { ...doc };
  delete copy.$schema;
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
      .map((r) => r.until)
      .sort(compareVersions)
      .pop();

// The definition of a channel, at a version.
const channelAt = (name, revision) => {
  for (const r of channelsDoc.revisions ?? []) {
    if (!rangesOverlap(r, revision)) continue;
    const found = (r.channels ?? []).find((c) => c.name === name);
    if (found) return found;
  }
  return null;
};

// The definition of a family, at a version.
const familyDefAt = (name, revision) => {
  for (const r of familiesDoc.revisions ?? []) {
    if (!rangesOverlap(r, revision)) continue;
    const found = (r.families ?? []).find((f) => f.name === name);
    if (found) return found;
  }
  return null;
};

// The values a family's plain command field can hold: what its width allows,
// less anything the family keeps for framing.
const plainRange = (family) => {
  const spec = family.command;
  if (!spec) return null;
  const field = family.header.find((f) => f.name === spec.field);
  const bits = field && SCALAR_BITS[field.type];
  if (!bits) return null;
  const kept = new Set(spec.reserved ?? []);
  if (spec.escape !== undefined) kept.add(spec.escape);
  return { max: 2 ** bits - 1, kept };
};

// Whether an identifier travels in the plain field or behind the escape.
const isPlain = (family, command) => {
  const range = plainRange(family);
  if (!range) return true;
  return command <= range.max && !range.kept.has(command);
};

// The value a header carries that identifies a message.
const effectiveCommand = (family, values) => {
  const spec = family.command;
  if (!spec) return null;
  const plain = values[spec.field];
  if (spec.escape !== undefined && plain === spec.escape) {
    return values[spec.extendedField] ?? null;
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
  const names = new Set();
  const ids = new Set();
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
const channelMissingFor = (messageRevision, name) => {
  const overlapping = (channelsDoc.revisions ?? []).filter((r) =>
    rangesOverlap(r, messageRevision),
  );
  if (overlapping.length === 0) return "is defined nowhere";
  const absent = overlapping.filter(
    (r) => !(r.channels ?? []).some((c) => c.name === name),
  );
  return absent.length ? `is not defined from ${absent[0].from}` : null;
};

// Structs first: messages reference them.
const structNames = new Set();
const structs = new Map();
const structFiles = [];
const openStructs = new Set();
for (const file of listJson("types")) {
  let doc;
  try {
    doc = readJson(file.path);
  } catch (error) {
    fail(file.path, `not valid JSON: ${error.message}`);
    continue;
  }
  if (!validateStruct(doc)) {
    report(file.path, validateStruct.errors);
    continue;
  }
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
      openStructs.has(last.struct)
    ) {
      openStructs.add(doc.struct);
      growing = true;
    }
  }
}

if (familiesAreValid) {
  (familiesDoc.revisions ?? []).forEach((revision, index) => {
    const at = `schema/families.json revision ${index}`;
    const names = new Set();
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
      if (!declared.has(spec.field)) {
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

const usedStructs = (fields) => {
  const found = [];
  for (const field of fields ?? []) {
    if (field.type === "struct") found.push(field.struct);
    if (field.type === "array" && field.items)
      found.push(...usedStructs([field.items]));
  }
  return found;
};
for (const { path, doc } of structFiles) {
  const trail = [doc.struct];
  const walk = (name) => {
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

const messages = [];
for (const file of listJson("messages")) {
  let doc;
  try {
    doc = readJson(file.path);
  } catch (error) {
    fail(file.path, `not valid JSON: ${error.message}`);
    continue;
  }
  if (!validateMessage(doc)) {
    report(file.path, validateMessage.errors);
    continue;
  }
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
    const reach = revision.until ? revision : { ...revision, until: specEnd };

    // Each of the three documents has to account for the whole range, not
    // merely disagree with none of it.
    for (const [what, revisions] of [
      ["protocol", protocolDoc.revisions ?? []],
      ["channel", channelsDoc.revisions ?? []],
      ["family", familiesDoc.revisions ?? []],
    ]) {
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
      const spec = family.command ?? {};
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
const familyAt = (channelName, revision) => {
  for (const r of channelsDoc.revisions ?? []) {
    if (!rangesOverlap(r, revision)) continue;
    const found = (r.channels ?? []).find((c) => c.name === channelName);
    if (found) return found.family;
  }
  return null;
};

// One command value cannot mean two things in the same family, in the same
// direction, at the same time.
const claims = messages.flatMap(({ where, doc }) =>
  doc.revisions.map((revision) => ({ where, message: doc.message, revision })),
);

for (let i = 0; i < claims.length; i += 1) {
  for (let j = i + 1; j < claims.length; j += 1) {
    const a = claims[i];
    const b = claims[j];
    if (a.message === b.message) continue;
    if (a.revision.command !== b.revision.command) continue;
    if (!rangesOverlap(a.revision, b.revision)) continue;
    const familyA = familyAt(a.revision.channel, a.revision);
    const familyB = familyAt(b.revision.channel, b.revision);
    if (familyA === null || familyB === null || familyA !== familyB) continue;
    if (!directionsOverlap(a.revision.direction, b.revision.direction))
      continue;
    const where =
      a.revision.channel === b.revision.channel
        ? `on channel "${a.revision.channel}"`
        : `across channels "${a.revision.channel}" and "${b.revision.channel}", which share the "${familyA}" numbering`;
    fail(
      a.where,
      `command ${a.revision.command} collides with ${b.message} ${where}`,
    );
  }
}

// Vectors. A subject says what is being checked.
const byMessage = new Map(messages.map(({ doc }) => [doc.message, doc]));
const covered = new Set();
const transportCovered = new Set();
// Which presence rules any vector has actually exercised, and which way.
const exercised = new Map();
// What a message vector decoded to, so an algorithm can only read that.
const decoded = new Map();
const algorithmsSeen = new Set();
const pendingAlgorithms = [];
const pascalFromKebab = (name) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const hexPairs = (text) => {
  const stripped = text.replace(/\s+/g, "");
  return stripped.length % 2 === 0 ? stripped.length / 2 : null;
};

const vectorFiles = [];
const walkVectors = (at, trail) => {
  for (const entry of readdirSync(at, { withFileTypes: true })) {
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
      const dir = { name: trail[0] };

      let doc;
      try {
        doc = readJson(path);
      } catch (error) {
        fail(path, `not valid JSON: ${error.message}`);
        continue;
      }
      vectorCount += 1;
      if (!validateVector(withoutPointer(doc))) {
        report(path, validateVector.errors);
        continue;
      }
      checkNotes(doc, path, "", true);

      for (const key of ["bytes", "key", "plaintext", "ciphertext"]) {
        if (doc[key] === undefined) continue;
        const pairs = hexPairs(doc[key]);
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
        const key = Buffer.from(doc.key.replace(/\s+/g, ""), "hex");
        // A cipher vector names no version, so it answers to every key size
        // any revision records.
        const sizes = new Set(
          (protocolDoc.revisions ?? [])
            .map((r) => r.cipher?.keySize)
            .filter((n) => n !== undefined),
        );
        if (sizes.size > 0 && !sizes.has(key.length)) {
          fail(
            path,
            `carries a ${key.length} byte key, and the recorded sizes are ${[...sizes].join(", ")}`,
          );
        }
        const plaintext = Buffer.from(
          doc.plaintext.replace(/\s+/g, ""),
          "hex",
        );
        const ciphertext = Buffer.from(
          doc.ciphertext.replace(/\s+/g, ""),
          "hex",
        );
        if (plaintext.length !== ciphertext.length) {
          fail(
            path,
            `enciphers ${plaintext.length} bytes into ${ciphertext.length}, and the cipher does not change length`,
          );
        } else {
          try {
            const written = encipher(key, plaintext);
            if (!written.equals(ciphertext)) {
              fail(
                path,
                `enciphers to ${written.toString("hex")}, and the vector says ${ciphertext.toString("hex")}`,
              );
            }
            const read = decipher(key, ciphertext);
            if (!read.equals(plaintext)) {
              fail(
                path,
                `deciphers to ${read.toString("hex")}, and the vector says ${plaintext.toString("hex")}`,
              );
            }
          } catch (error) {
            if (!(error instanceof CipherError)) throw error;
            // Nothing below can be checked without the algorithm, so stop
            // rather than report every vector as a failure of its own.
            console.error(error.message);
            process.exit(1);
          }
        }
        continue;
      }

      if (!protocolIsValid) {
        // Every layout below is read out of a file the meta-schema rejected,
        // so the errors already reported are the ones worth reading.
        continue;
      }
      const protocolRevision = (protocolDoc.revisions ?? []).find((r) =>
        covers(r, doc.version),
      );
      if (!protocolRevision) {
        fail(
          path,
          `version ${doc.version} falls outside every protocol revision`,
        );
        continue;
      }

      let defined;
      let claim = null;
      if (doc.subject === "transport") {
        if (dir.name !== "transport") {
          fail(path, `sits under "${dir.name}" but its subject is transport`);
        }
        defined = protocolRevision.transport.header;
        transportCovered.add(protocolRevision.from);
      } else {
        if (pascalFromKebab(dir.name) !== doc.message) {
          fail(
            path,
            `sits under "${dir.name}" but names message "${doc.message}"`,
          );
        }
        const message = byMessage.get(doc.message);
        if (!message) {
          fail(
            path,
            `names message "${doc.message}", which has no definition`,
          );
          continue;
        }
        const revision = message.revisions.find((r) => covers(r, doc.version));
        if (!revision) {
          fail(
            path,
            `version ${doc.version} falls outside every revision of ${doc.message}`,
          );
          continue;
        }
        covered.add(`${doc.message}@${revision.from}`);
        const channel = channelAt(revision.channel, revision);
        const family = channel && familyDefAt(channel.family, revision);
        if (!family) {
          fail(
            path,
            `travels on channel "${revision.channel}", whose family is defined nowhere for ${doc.version}`,
          );
          continue;
        }
        // A vector covers every byte of the payload, header included.
        defined = [...family.header, ...revision.fields];
        claim = {
          family,
          command: revision.command,
          message: doc.message,
          revision,
        };
      }

      const names = new Set(defined.map((f) => f.name));
      for (const name of Object.keys(doc.fields)) {
        if (!names.has(name)) {
          fail(
            path,
            `decodes a field "${name}" that the revision does not define`,
          );
        }
      }
      // A field a presence rule leaves out is written as null rather than omitted.
      for (const field of defined) {
        if (!(field.name in doc.fields)) {
          fail(path, `does not decode the field "${field.name}"`);
        } else if (doc.fields[field.name] === null && !field.present) {
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
      const endian = protocolRevision.endian;
      const payload = Buffer.from(doc.bytes.replace(/\s+/g, ""), "hex");
      // A payload is covered from its first byte: a message opens with the
      // header its family carries, and a transport vector with the packet
      // header itself.
      const start = 0;
      try {
        const sealed = needingKey(defined, structs);
        let cipher = null;
        if (sealed.length > 0) {
          if (doc.key === undefined) {
            fail(
              path,
              `records ${sealed.map((n) => `"${n}"`).join(", ")}, which travels enciphered, so the vector needs the key that reads it`,
            );
            continue;
          }
          const key = Buffer.from(doc.key.replace(/\s+/g, ""), "hex");
          cipher = {
            decipher: (bytes) => decipher(key, bytes),
            encipher: (bytes) => encipher(key, bytes),
          };
        } else if (doc.key !== undefined) {
          fail(
            path,
            "carries a key, and no field of this message travels enciphered",
          );
          continue;
        }
        const read = decodeFields(
          defined,
          payload,
          start,
          structs,
          endian,
          {},
          cipher,
        );
        if (doc.subject === "message" && read.offset !== payload.length) {
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
              `carries command ${carried}, and ${claim.message} is command ${claim.command} at this version`,
            );
          } else {
            const spec = claim.family.command ?? {};
            const wantsPlain = isPlain(claim.family, claim.command);
            const usedEscape =
              spec.escape !== undefined &&
              read.values[spec.field] === spec.escape;
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
        if (claim) {
          const note = (path, absent) => {
            const key = path.startsWith("struct:")
              ? `#${path}`
              : `${claim.message}@${claim.revision.from}#${path}`;
            const seenSoFar = exercised.get(key) ?? {
              present: false,
              absent: false,
            };
            if (absent) seenSoFar.absent = true;
            else seenSoFar.present = true;
            exercised.set(key, seenSoFar);
          };
          walkPresence(claim.revision.fields, read.values, structs, "", note);
        }
        if (doc.subject === "message") {
          decoded.set(`${dir.name}/${basename(path, ".json")}`, read.values);
        }
        const expected = canonical(doc.fields);
        const actual = canonical(read.values);
        if (expected !== actual) {
          fail(
            path,
            `bytes decode to ${actual}, and the vector says ${expected}`,
          );
        } else {
          const written = encodeFields(
            defined,
            doc.fields,
            structs,
            endian,
            {},
            cipher,
          );
          const wanted = payload.subarray(start, read.offset);
          if (!written.equals(wanted)) {
            fail(
              path,
              `fields encode to ${written.toString("hex")}, and the bytes are ${wanted.toString("hex")}`,
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
  const run = ALGORITHMS[doc.algorithm];
  if (!run) {
    fail(path, `names algorithm "${doc.algorithm}", which nothing implements`);
    continue;
  }
  algorithmsSeen.add(doc.algorithm);
  const source = decoded.get(doc.input.vector);
  if (!source) {
    fail(
      path,
      `reads "${doc.input.vector}", which is not a message vector that decoded`,
    );
    continue;
  }
  let input = source;
  for (const part of doc.input.field.split(".")) input = input?.[part];
  if (input === undefined) {
    fail(
      path,
      `reads "${doc.input.field}" of "${doc.input.vector}", which holds no such field`,
    );
    continue;
  }
  let got;
  try {
    got = canonical(run(input));
  } catch (error) {
    fail(path, `could not be run: ${error.message}`);
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
      "scripts/algorithms.mjs",
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

for (const { where, doc } of messages) {
  for (const revision of doc.revisions ?? []) {
    const ruled = [];
    const collect = (fields, prefix, seenStructs = new Set()) => {
      for (const field of fields ?? []) {
        const path = prefix ? `${prefix}.${field.name}` : field.name;
        if (field.present) ruled.push(path);
        if (field.type === "record") collect(field.fields, path, seenStructs);
        else if (field.type === "struct" && !seenStructs.has(field.struct)) {
          const d = structs.get(field.struct);
          if (d)
            collect(
              d.fields,
              `struct:${field.struct}`,
              new Set([...seenStructs, field.struct]),
            );
        } else if (field.type === "array" && field.items) {
          collect([field.items], path, seenStructs);
        }
      }
    };
    collect(revision.fields, "");
    for (const path of ruled) {
      // A rule inside a struct belongs to the struct, so any message that
      // carries it can be the one that evidences it.
      const shared = path.startsWith("struct:");
      const key = shared
        ? `#${path}`
        : `${doc.message}@${revision.from}#${path}`;
      const seen = exercised.get(key);
      if (!seen) {
        fail(
          where,
          `revision ${revision.from} has no vector reaching "${path}" at all`,
        );
        continue;
      }
      if (!seen.present || !seen.absent) {
        fail(
          where,
          `revision ${revision.from} has no vector where "${path}" is ${seen.present ? "absent" : "present"}, so half its presence rule is unrecorded`,
        );
      }
    }
    if (!covered.has(`${doc.message}@${revision.from}`)) {
      fail(
        where,
        `revision ${revision.from} has no vector, so nothing checks its layout against a recorded payload`,
      );
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}

console.log(
  `Checked ${messages.length} message(s), ${structNames.size} struct(s) and ${vectorCount} vector(s). No problems.`,
);
