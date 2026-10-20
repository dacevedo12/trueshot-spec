// Start a new range of versions in the definitions, for an author to correct.
//
//   bun scripts/range.ts split <build>
//     ends every revision that covers <build> just before it, and starts a
//     copy of it at <build>, so the two can differ.
//   bun scripts/range.ts copy <model build> <from> <until>
//     gives every definition with a revision covering <model build> a copy of
//     that revision for the builds from <from> up to <until>, leaving alone
//     any definition that already covers part of them; run it again with
//     another model to fill in what the first lacks.
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
import { bindings } from "./bindings.ts";
import { compare, covers, ranges } from "./schema.ts";
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
const NAMED =
  /\b\d+\.\d+(?:\.\d+\.\d+)?(?: to \d+\.\d+)? (?:clients?|servers?|builds?|ones?)\b|\b(?:from|on|in|before|after|up to) \d+\.\d+(?:\.\d+\.\d+)?\b/;
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

const before = ranges();
const changed: [string, Doc][] = [];
const review: string[] = [];
const skipped: string[] = [];
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
      // Already given, by this copy run earlier or one from another model.
      skipped.push(path);
      continue;
    }
    const copy = ranged(source, span.from, span.until);
    namedNotes(copy, `${path} ${from}: a copied note names a build`, review);
    revisions.push(copy);
    revisions.sort((a, b) => compare(a.from, b.from));
    changed.push([path, doc]);
  } else usage();
}

if (changed.length === 0)
  problems.push(
    skipped.length > 0
      ? "every definition the model has already covers part of that span, so nothing changed"
      : "no definition covers that build, so nothing changed",
  );
// A binding for one range holds for the range starting at its build alone, so
// a split leaves the second half without it.
if (command === "split") {
  const at = args[0] ?? "";
  const split = before.find((r) => covers(r, at) && r.from !== at);
  for (const b of bindings)
    if (split !== undefined && b.until === undefined && b.from === split.from)
      review.push(
        `${b.dir} holds for ${split.from} up to ${at} alone now; what still holds from ${at} goes in spec/bindings/${at.replace(/\./g, "-")}`,
      );
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
console.log(
  `changed ${changed.length} definitions${skipped.length > 0 ? `, and left ${skipped.length} that already cover part of the span` : ""}`,
);
if (review.length > 0)
  console.log(`\nLeft to review:\n  ${review.join("\n  ")}`);
