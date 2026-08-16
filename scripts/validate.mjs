// Checks the schema files for things JSON Schema cannot express.
//
// JSON Schema validates the shape of a definition. It cannot tell whether a
// channel exists, whether a struct reference resolves, whether a field
// reference points backwards at something countable, or whether two revisions
// claim the same command byte over the same versions. Those checks live here.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import Ajv from "ajv/dist/2020.js";

const SCHEMA_DIR = "schema";
const COUNTABLE = new Set(["u8", "u16", "u32", "u64"]);
const RESERVED = new Set(["remaining", "terminated"]);

const problems = [];

function fail(where, message) {
  problems.push(`${where}: ${message}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

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

function parseVersion(text) {
  return text.split(".").map(Number);
}

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

// A bidirectional message occupies its command byte in both directions.
function directionsOverlap(a, b) {
  return a === b || a === "bidirectional" || b === "bidirectional";
}

// Walks a field list at any depth. `outer` carries the names already read in
// enclosing scopes, so an array element may size itself from an earlier field.
function checkFields(fields, outer, structNames, at) {
  const seen = new Map(outer);

  for (const field of fields) {
    for (const key of ["count", "size"]) {
      const value = field[key];
      if (typeof value !== "string" || RESERVED.has(value)) continue;
      if (!seen.has(value)) {
        fail(at, `field "${field.name}" ${key} refers to "${value}", which is not an earlier field`);
      } else if (!COUNTABLE.has(seen.get(value))) {
        fail(at, `field "${field.name}" ${key} refers to "${value}", which is ${seen.get(value)} rather than an unsigned integer`);
      }
    }

    if (field.size === "terminated" && field.type !== "string") {
      fail(at, `field "${field.name}" is ${field.type}, so it cannot be terminated`);
    }

    if (field.type === "struct" && !structNames.has(field.struct)) {
      fail(at, `field "${field.name}" refers to struct "${field.struct}", which has no definition`);
    }

    if (seen.has(field.name) && !outer.has(field.name)) {
      fail(at, `field "${field.name}" is declared twice`);
    }
    seen.set(field.name, field.type);

    if (field.type === "array" && field.items) {
      checkFields([field.items], seen, structNames, `${at} > ${field.name}[]`);
    }
  }

  return seen;
}

const messageSchema = readConfig(join(SCHEMA_DIR, "message.json"));
const structSchema = readConfig(join(SCHEMA_DIR, "struct.json"));
const channelsDoc = readConfig(join(SCHEMA_DIR, "channels.json"));

if (!messageSchema || !structSchema || !channelsDoc) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

if (!Array.isArray(channelsDoc.channels)) {
  fail("schema/channels.json", "has no channels array");
}
const channels = new Set((channelsDoc.channels ?? []).map((c) => c.name));

const ajv = new Ajv({ strict: true, allErrors: true });
ajv.addSchema(messageSchema);
const validateMessage = ajv.getSchema(messageSchema.$id);
const validateStruct = ajv.compile(structSchema);

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
    for (const error of validateStruct.errors) {
      fail(file.path, `${error.instancePath || "/"} ${error.message}`);
    }
    continue;
  }
  if (basename(file.name, ".json") !== doc.struct) {
    fail(file.path, `file name does not match struct identity "${doc.struct}"`);
  }
  structNames.add(doc.struct);
}

for (const file of listJson("types")) {
  const name = basename(file.name, ".json");
  if (!structNames.has(name)) continue;
  const doc = readJson(file.path);
  checkFields(doc.fields, new Map(), structNames, file.path);
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
    for (const error of validateMessage.errors) {
      fail(file.path, `${error.instancePath || "/"} ${error.message}`);
    }
    continue;
  }

  if (basename(file.name, ".json") !== doc.message) {
    fail(file.path, `file name does not match message identity "${doc.message}"`);
  }

  messages.push({ where: file.path, doc });
}

for (const { where, doc } of messages) {
  doc.revisions.forEach((revision, index) => {
    const at = `${where} revision ${index}`;

    if (!channels.has(revision.channel)) {
      fail(at, `channel "${revision.channel}" is not in channels.json`);
    }

    if (revision.until && compareVersions(revision.from, revision.until) >= 0) {
      fail(at, `from "${revision.from}" is not before until "${revision.until}"`);
    }

    checkFields(revision.fields, new Map(), structNames, at);
  });

  for (let i = 0; i < doc.revisions.length; i += 1) {
    for (let j = i + 1; j < doc.revisions.length; j += 1) {
      if (rangesOverlap(doc.revisions[i], doc.revisions[j])) {
        fail(where, `revisions ${i} and ${j} cover overlapping client versions`);
      }
    }
  }
}

// One command byte cannot mean two things on the same channel, in the same
// direction, at the same time.
const claims = [];
for (const { where, doc } of messages) {
  for (const revision of doc.revisions) {
    claims.push({ where, message: doc.message, revision });
  }
}

for (let i = 0; i < claims.length; i += 1) {
  for (let j = i + 1; j < claims.length; j += 1) {
    const a = claims[i];
    const b = claims[j];
    if (a.message === b.message) continue;
    if (a.revision.command !== b.revision.command) continue;
    if (a.revision.channel !== b.revision.channel) continue;
    if (!directionsOverlap(a.revision.direction, b.revision.direction)) continue;
    if (!rangesOverlap(a.revision, b.revision)) continue;
    fail(
      a.where,
      `command ${a.revision.command} on channel "${a.revision.channel}" collides with ${b.message}`,
    );
  }
}

// A vector claims a packet decodes to a struct. It has to name a message that
// exists, at a version that message covers, with the fields that revision
// defines.
const vectorSchema = readConfig(join(SCHEMA_DIR, "vector.json"));
const validateVector = vectorSchema ? ajv.compile(vectorSchema) : null;
const byMessage = new Map(messages.map(({ doc }) => [doc.message, doc]));

// Directory names stay kebab-case like every other directory. key-check holds
// the vectors for KeyCheck.
function pascalFromKebab(name) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function revisionFor(doc, version) {
  return doc.revisions.find(
    (r) =>
      compareVersions(version, r.from) >= 0 &&
      (!r.until || compareVersions(version, r.until) < 0),
  );
}

let vectorCount = 0;
const VECTOR_DIR = join("conformance", "vectors");
if (validateVector && existsSync(VECTOR_DIR)) {
  for (const dir of readdirSync(VECTOR_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const name of readdirSync(join(VECTOR_DIR, dir.name))) {
      if (!name.endsWith(".json")) continue;
      const path = join(VECTOR_DIR, dir.name, name);
      vectorCount += 1;

      let doc;
      try {
        doc = readJson(path);
      } catch (error) {
        fail(path, `not valid JSON: ${error.message}`);
        continue;
      }
      if (!validateVector(doc)) {
        for (const error of validateVector.errors) {
          fail(path, `${error.instancePath || "/"} ${error.message}`);
        }
        continue;
      }

      if (pascalFromKebab(dir.name) !== doc.message) {
        fail(path, `sits under "${dir.name}" but names message "${doc.message}"`);
      }

      const hex = doc.bytes.replace(/\s+/g, "");
      if (hex.length % 2 !== 0) {
        fail(path, `bytes has an odd number of hexadecimal digits`);
      }

      const message = byMessage.get(doc.message);
      if (!message) {
        fail(path, `names message "${doc.message}", which has no definition`);
        continue;
      }

      const revision = revisionFor(message, doc.version);
      if (!revision) {
        fail(path, `version ${doc.version} falls outside every revision of ${doc.message}`);
        continue;
      }

      const defined = new Set(revision.fields.map((f) => f.name));
      for (const name of Object.keys(doc.fields)) {
        if (!defined.has(name)) {
          fail(path, `decodes a field "${name}" that the revision does not define`);
        }
      }
      for (const name of defined) {
        if (!(name in doc.fields)) {
          fail(path, `does not decode the field "${name}"`);
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
