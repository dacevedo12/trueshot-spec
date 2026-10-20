// Start a new range of versions in the definitions, for an author to correct.
//
//   bun scripts/range.ts split <build>
//     ends every revision that covers <build> just before it, and starts a
//     copy of it at <build>, so the two can differ.
//   bun scripts/range.ts copy <model build> <from> <until>
//     gives every definition with a revision covering <model build> a copy of
//     that revision for the builds from <from> up to <until>, which nothing
//     may cover yet.
//
// Both only lay out a starting point. A copied revision claims what its model
// does until someone shows the new builds agree, so the tool lists what is
// left to show: every copied note that names a build, since it now sits in a
// revision for other builds. No vector is copied, because a vector is evidence
// of the builds it names; `bun run check` then lists every revision still
// without one.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { compare, covers } from "./schema.ts";
import type { Ranged } from "./schema.ts";

const ROOT = join(import.meta.dir, "..");
const BUILD = /^\d+\.\d+\.\d+\.\d+$/;
const [command, ...args] = process.argv.slice(2);
const usage = (): never => {
  console.error(
    "usage: bun scripts/range.ts split <build>\n       bun scripts/range.ts copy <model build> <from> <until>",
  );
  process.exit(2);
};
if (args.some((a) => !BUILD.test(a))) usage();

const files = [
  "schema/protocol.json",
  "schema/channels.json",
  "schema/families.json",
  ...["messages", "types"].flatMap((dir) =>
    readdirSync(join(ROOT, "schema", dir))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => `schema/${dir}/${f}`),
  ),
];

type Revision = Ranged & Record<string, unknown>;
interface Doc {
  revisions: Revision[];
}

// A revision's keys in the order the files keep them: its range first.
const ranged = (r: Revision, from: string, until: string): Revision => {
  const { from: _f, until: _u, ...rest } = r;
  return { from, until, ...rest };
};

// Notes anywhere in a revision that name a build, which a copy carries to
// builds they were not written for.
const NAMED = /\b\d+\.\d+(?:\.\d+\.\d+)?(?: to \d+\.\d+)? clients?\b/;
function namedNotes(value: unknown, path: string, out: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => namedNotes(v, `${path}[${i}]`, out));
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const [k, v] of Object.entries(value)) {
    if (k === "note" && typeof v === "string" && NAMED.test(v))
      out.push(`${path}: ${v}`);
    else namedNotes(v, `${path}/${k}`, out);
  }
}

const changed: [string, Doc][] = [];
const review: string[] = [];
const problems: string[] = [];

for (const path of files) {
  const doc = JSON.parse(readFileSync(join(ROOT, path), "utf8")) as Doc;
  const revisions = doc.revisions;
  if (command === "split" && args.length === 1) {
    const [at = ""] = args;
    const i = revisions.findIndex((r) => covers(r, at) && r.from !== at);
    const r = revisions[i];
    if (r === undefined || r.until === undefined) continue;
    revisions.splice(i, 1, ranged(r, r.from, at), ranged(r, at, r.until));
    changed.push([path, doc]);
  } else if (command === "copy" && args.length === 3) {
    const [model = "", from = "", until = ""] = args;
    if (compare(from, until) >= 0) usage();
    const source = revisions.find((r) => covers(r, model));
    if (source === undefined) continue;
    const span = { from, until };
    if (
      revisions.some(
        (r) =>
          compare(r.from, until) < 0 &&
          (r.until === undefined || compare(from, r.until) < 0),
      )
    ) {
      problems.push(
        `${path}: a revision already covers part of ${from} up to ${until}`,
      );
      continue;
    }
    const copy = ranged(source, span.from, span.until);
    namedNotes(copy, `${path} ${from}`, review);
    revisions.push(copy);
    revisions.sort((a, b) => compare(a.from, b.from));
    changed.push([path, doc]);
  } else usage();
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
const options = {
  ...(await prettier.resolveConfig(join(ROOT, "schema/x.json"))),
  parser: "json",
};
for (const [path, doc] of changed)
  writeFileSync(
    join(ROOT, path),
    await prettier.format(JSON.stringify(doc), options),
  );
console.log(`changed ${changed.length} definitions`);
if (review.length > 0)
  console.log(
    `\nThese copied notes name a build, and now sit in a revision for others:\n  ${review.join("\n  ")}`,
  );
