// Checks the schema files for things JSON Schema cannot express.
//
// JSON Schema validates the shape of a definition. It cannot tell whether a
// channel exists at the version a message claims, whether a struct reference
// resolves, whether a reference points backwards at something countable, or
// whether two revisions claim the same command byte over the same versions.
// Those checks live here.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import Ajv from "ajv/dist/2020.js";

const SCHEMA_DIR = "schema";
const META = join(SCHEMA_DIR, "meta");
const VECTOR_DIR = join("conformance", "vectors");

const COUNTABLE = new Set(["u8", "u16", "u32", "u64"]);
const TRUTHY = new Set([...COUNTABLE, "i8", "i16", "i32", "i64"]);
const RESERVED = new Set(["remaining", "terminated"]);

// A revision describes itself. Prose carried as data reaches generated output,
// so it holds to the same rule as the documents, and no linter reads JSON.
const TEMPORAL = [
  "later version",
  "earlier version",
  "newer version",
  "older version",
  "no longer",
  "used to",
  "previously",
  "originally",
  "so far",
  "to date",
  "for now",
  "at present",
  "currently",
  "gained",
  "yet",
];

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

// A bidirectional message occupies its command byte in both directions.
const directionsOverlap = (a, b) =>
  a === b || a === "bidirectional" || b === "bidirectional";

// Every list of revisions holds to the same rules, whatever it describes.
function checkRevisions(revisions, where) {
  revisions.forEach((revision, index) => {
    if (revision.until && compareVersions(revision.from, revision.until) >= 0) {
      fail(
        `${where} revision ${index}`,
        `from "${revision.from}" is not before until "${revision.until}"`,
      );
    }
  });
  for (let i = 0; i < revisions.length; i += 1) {
    for (let j = i + 1; j < revisions.length; j += 1) {
      if (rangesOverlap(revisions[i], revisions[j])) {
        fail(where, `revisions ${i} and ${j} cover overlapping client versions`);
      }
    }
  }
}

function checkNotes(value, where, path = "") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkNotes(item, where, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const here = `${path}/${key}`;
    if ((key === "note" || key === "description") && typeof child === "string") {
      const lower = child.toLowerCase();
      for (const token of TEMPORAL) {
        if (lower.includes(token)) {
          fail(where, `${here} says "${token}", which describes a moment rather than a version`);
        }
      }
      continue;
    }
    checkNotes(child, where, here);
  }
}

// Walks a field list at any depth. `outer` carries the names already read in
// enclosing scopes, so an array element may size itself from an earlier field.
// Bit runs are addressable as parent.bit, which is what a presence rule points
// at.
function checkFields(fields, outer, structNames, at) {
  const seen = new Map(outer);

  fields.forEach((field, index) => {
    const last = index === fields.length - 1;

    if (field.present) {
      const target = field.present.when;
      if (!seen.has(target)) {
        fail(at, `field "${field.name}" is present when "${target}", which is not an earlier field`);
      } else {
        const entry = seen.get(target);
        if (!TRUTHY.has(entry.type)) {
          fail(at, `field "${field.name}" is present when "${target}", which is ${entry.type} and has no truth value`);
        }
        if (field.present.equals !== undefined && entry.width !== undefined) {
          const ceiling = 2 ** entry.width;
          if (field.present.equals < 0 || field.present.equals >= ceiling) {
            fail(at, `field "${field.name}" is present when "${target}" equals ${field.present.equals}, which ${entry.width} bit(s) cannot hold`);
          }
        }
      }
    }

    if (field.type === "bits") {
      const declared = field.bits.reduce((total, run) => total + run.width, 0);
      const available = field.size * 8;
      if (declared !== available) {
        fail(at, `field "${field.name}" declares ${declared} bits across ${field.size} byte(s), which holds ${available}`);
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
      const value = field[key];
      if (typeof value !== "string") continue;
      if (value === "remaining" && !last) {
        fail(at, `field "${field.name}" ${key} runs to the end of the payload, so nothing may follow it`);
      }
      if (RESERVED.has(value)) continue;
      if (!seen.has(value)) {
        fail(at, `field "${field.name}" ${key} refers to "${value}", which is not an earlier field`);
      } else if (!COUNTABLE.has(seen.get(value).type)) {
        fail(at, `field "${field.name}" ${key} refers to "${value}", which is ${seen.get(value).type} rather than an unsigned integer`);
      }
    }

    if (field.size === "terminated" && field.type !== "string") {
      fail(at, `field "${field.name}" is ${field.type}, so it cannot be terminated`);
    }

    if (field.type === "struct" && !structNames.has(field.struct)) {
      fail(at, `field "${field.name}" refers to struct "${field.struct}", which has no definition`);
    }

    if (seen.has(field.name)) {
      fail(at, outer.has(field.name)
        ? `field "${field.name}" shadows an enclosing field of the same name`
        : `field "${field.name}" is declared twice`);
    }
    seen.set(field.name, { type: field.type });

    if (field.type === "array" && field.items) {
      checkFields([field.items], seen, structNames, `${at} > ${field.name}[]`);
    }
  });

  return seen;
}

const messageSchema = readConfig(join(META, "message.json"));
const structSchema = readConfig(join(META, "struct.json"));
const protocolSchema = readConfig(join(META, "protocol.json"));
const channelsSchema = readConfig(join(META, "channels.json"));
const vectorSchema = readConfig(join(META, "vector.json"));
const protocolDoc = readConfig(join(SCHEMA_DIR, "protocol.json"));
const channelsDoc = readConfig(join(SCHEMA_DIR, "channels.json"));

if (!messageSchema || !structSchema || !protocolSchema || !channelsSchema ||
    !vectorSchema || !protocolDoc || !channelsDoc) {
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

const report = (where, errors) => {
  for (const error of errors) {
    const detail = error.params && Object.keys(error.params).length
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

if (!validateProtocol(withoutPointer(protocolDoc))) {
  report("schema/protocol.json", validateProtocol.errors);
}
if (!validateChannels(withoutPointer(channelsDoc))) {
  report("schema/channels.json", validateChannels.errors);
}

checkRevisions(protocolDoc.revisions ?? [], "schema/protocol.json");
checkRevisions(channelsDoc.revisions ?? [], "schema/channels.json");
checkNotes(protocolDoc, "schema/protocol.json");
checkNotes(channelsDoc, "schema/channels.json");
checkNotes(protocolSchema, "schema/meta/protocol.json");
checkNotes(messageSchema, "schema/meta/message.json");
checkNotes(vectorSchema, "schema/meta/vector.json");

// A channel name is how a message inherits encryption and reliability, so two
// definitions of one name at one version make every message on it undecidable.
(channelsDoc.revisions ?? []).forEach((revision, index) => {
  const names = new Set();
  const ids = new Set();
  for (const channel of revision.channels ?? []) {
    if (names.has(channel.name)) {
      fail(`schema/channels.json revision ${index}`, `channel "${channel.name}" is defined twice`);
    }
    if (ids.has(channel.id)) {
      fail(`schema/channels.json revision ${index}`, `channel id ${channel.id} is claimed twice`);
    }
    names.add(channel.name);
    ids.add(channel.id);
  }
});

const channelsAt = (version) => {
  const revision = (channelsDoc.revisions ?? []).find((r) => covers(r, version));
  return new Set((revision?.channels ?? []).map((c) => c.name));
};

// The transport header uses the same field vocabulary, so it gets the same walk.
(protocolDoc.revisions ?? []).forEach((revision, index) => {
  if (revision.transport?.header) {
    checkFields(revision.transport.header, new Map(), new Set(),
      `schema/protocol.json revision ${index} header`);
  }
});

// Structs first: messages reference them.
const structNames = new Set();
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
    fail(file.path, `file name does not match struct identity "${doc.struct}"`);
  }
  checkNotes(doc, file.path);
  structNames.add(doc.struct);
}
for (const file of listJson("types")) {
  const doc = readJson(file.path);
  if (structNames.has(doc.struct)) {
    checkFields(doc.fields, new Map(), structNames, file.path);
  }
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
    fail(file.path, `file name does not match message identity "${doc.message}"`);
  }
  checkNotes(doc, file.path);
  messages.push({ where: file.path, doc });
}

for (const { where, doc } of messages) {
  checkRevisions(doc.revisions, where);
  doc.revisions.forEach((revision, index) => {
    const at = `${where} revision ${index}`;
    if (!channelsAt(revision.from).has(revision.channel)) {
      fail(at, `channel "${revision.channel}" is not defined at ${revision.from}`);
    }
    checkFields(revision.fields, new Map(), structNames, at);
  });
}

// One command byte cannot mean two things on the same channel, in the same
// direction, at the same time.
const claims = messages.flatMap(({ where, doc }) =>
  doc.revisions.map((revision) => ({ where, message: doc.message, revision })));

for (let i = 0; i < claims.length; i += 1) {
  for (let j = i + 1; j < claims.length; j += 1) {
    const a = claims[i];
    const b = claims[j];
    if (a.message === b.message) continue;
    if (a.revision.command !== b.revision.command) continue;
    if (a.revision.channel !== b.revision.channel) continue;
    if (!directionsOverlap(a.revision.direction, b.revision.direction)) continue;
    if (!rangesOverlap(a.revision, b.revision)) continue;
    fail(a.where, `command ${a.revision.command} on channel "${a.revision.channel}" collides with ${b.message}`);
  }
}

// Vectors. A subject says what is being checked.
const byMessage = new Map(messages.map(({ doc }) => [doc.message, doc]));
const pascalFromKebab = (name) =>
  name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");

const hexPairs = (text) => {
  const stripped = text.replace(/\s+/g, "");
  return stripped.length % 2 === 0 ? stripped.length / 2 : null;
};

let vectorCount = 0;
if (existsSync(VECTOR_DIR)) {
  for (const dir of readdirSync(VECTOR_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const name of readdirSync(join(VECTOR_DIR, dir.name))) {
      if (!name.endsWith(".json")) continue;
      const path = join(VECTOR_DIR, dir.name, name);

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
      checkNotes(doc, path);

      for (const key of ["bytes", "key", "plaintext", "ciphertext"]) {
        if (doc[key] === undefined) continue;
        const pairs = hexPairs(doc[key]);
        if (pairs === null) {
          fail(path, `${key} has an odd number of hexadecimal digits`);
        } else if (pairs === 0) {
          fail(path, `${key} holds no bytes`);
        }
      }

      if (doc.subject === "cipher") continue;

      const protocolRevision = (protocolDoc.revisions ?? []).find((r) => covers(r, doc.version));
      if (!protocolRevision) {
        fail(path, `version ${doc.version} falls outside every protocol revision`);
        continue;
      }

      let defined;
      if (doc.subject === "transport") {
        if (dir.name !== "transport") {
          fail(path, `sits under "${dir.name}" but its subject is transport`);
        }
        defined = protocolRevision.transport.header;
      } else {
        if (pascalFromKebab(dir.name) !== doc.message) {
          fail(path, `sits under "${dir.name}" but names message "${doc.message}"`);
        }
        const message = byMessage.get(doc.message);
        if (!message) {
          fail(path, `names message "${doc.message}", which has no definition`);
          continue;
        }
        const revision = message.revisions.find((r) => covers(r, doc.version));
        if (!revision) {
          fail(path, `version ${doc.version} falls outside every revision of ${doc.message}`);
          continue;
        }
        defined = revision.fields;
        const stripped = doc.bytes.replace(/\s+/g, "");
        const leading = parseInt(stripped.slice(0, 2), 16);
        if (leading !== revision.command) {
          fail(path, `starts with byte ${leading}, and ${doc.message} carries command ${revision.command}`);
        }
      }

      const names = new Set(defined.map((f) => f.name));
      for (const name of Object.keys(doc.fields)) {
        if (!names.has(name)) {
          fail(path, `decodes a field "${name}" that the revision does not define`);
        }
      }
      // A field a presence rule leaves out is written as null rather than omitted.
      for (const field of defined) {
        if (!(field.name in doc.fields)) {
          fail(path, `does not decode the field "${field.name}"`);
        } else if (doc.fields[field.name] === null && !field.present) {
          fail(path, `writes "${field.name}" as absent, but no presence rule governs it`);
        }
      }
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
