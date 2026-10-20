// The chapters and their bindings, as the books and the site both read them.
//
// The chapters under spec/ are the core, which holds for every range, taken in
// the order spec/README.md reads them. What a range alone does lives in
// spec/bindings/<range>/<chapter>.md, as entries that each begin with a
// `<!-- place: name -->` line naming the place in the chapter it fills: a
// `<!-- binding: name -->` line.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compare } from "./schema.ts";
import type { Ranged } from "./schema.ts";

const ROOT = join(import.meta.dir, "..");
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

// The chapters, in the order spec/README.md gives them.
const index = read("spec/README.md").split("## Reading order")[1] ?? "";
const chapters: readonly string[] = [
  ...new Set(
    [...index.matchAll(/\]\(([a-z-]+)\.md\)/g)].map((m) => m[1] ?? ""),
  ),
];

const ANCHOR = /^<!-- binding: ([a-z][a-z0-9-]*) -->$/gm;
const PLACE = /^<!-- place: ([a-z][a-z0-9-]*) -->$/m;

// The places a chapter marks, in the order it marks them.
const placesOf = (chapter: string): string[] =>
  [...read(`spec/${chapter}.md`).matchAll(ANCHOR)].map((m) => m[1] ?? "");

// The entries of one binding file, by the place each fills. An entry begins
// at a `<!-- place: name -->` line and runs to the next, so it can hold
// headings and lists of its own; the file's title is the chapter's. A place
// given twice is reported to `problems`.
function sections(path: string, problems: string[] = []): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(join(ROOT, path))) return out;
  const parts = read(path).split(PLACE).slice(1);
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const key = parts[i] ?? "";
    if (out.has(key)) problems.push(`${path}: "${key}" is given twice`);
    out.set(key, (parts[i + 1] ?? "").trim());
  }
  return out;
}

// A binding is named for the first build of its range, or for a span of
// ranges as two builds joined by "--", the second where the span stops: one
// that holds for every range from the first build up to the second.
interface Binding {
  readonly dir: string;
  readonly from: string;
  readonly until?: string;
}
const unslug = (s: string): string => s.replace(/-/g, ".");
const bindings: readonly Binding[] = (
  existsSync(join(ROOT, "spec/bindings"))
    ? readdirSync(join(ROOT, "spec/bindings")).sort()
    : []
)
  .filter((name) => !name.endsWith(".md"))
  .map((name) => {
    const [from = "", until] = name.split("--");
    return {
      dir: `spec/bindings/${name}`,
      from: unslug(from),
      ...(until === undefined ? {} : { until: unslug(until) }),
    };
  });
const appliesTo = (b: Binding, r: Ranged): boolean =>
  b.until === undefined
    ? b.from === r.from
    : compare(r.from, b.from) >= 0 &&
      r.until !== undefined &&
      compare(r.until, b.until) <= 0;
// The widest span first, then narrower ones, then the range's own, so the
// narrower says the last word.
const bindingsFor = (r: Ranged): Binding[] =>
  bindings
    .filter((b) => appliesTo(b, r))
    .sort((x, y) => {
      if (x.until === undefined || y.until === undefined)
        return (
          (x.until === undefined ? 1 : 0) - (y.until === undefined ? 1 : 0)
        );
      return compare(y.until, x.until) || compare(x.from, y.from);
    });

// What a range sets in each place of each chapter, as the binding files
// hold it: chapter → place → the entries in the order the book sets them,
// each with the binding it comes from.
function filled(r: Ranged): Map<string, Map<string, Binding[]>> {
  const out = new Map<string, Map<string, Binding[]>>();
  for (const b of bindingsFor(r)) {
    for (const file of readdirSync(join(ROOT, b.dir))) {
      const chapter = file.replace(/\.md$/, "");
      const own = out.get(chapter) ?? new Map<string, Binding[]>();
      for (const key of sections(`${b.dir}/${file}`).keys())
        own.set(key, [...(own.get(key) ?? []), b]);
      out.set(chapter, own);
    }
  }
  return out;
}

export {
  ANCHOR,
  appliesTo,
  bindings,
  bindingsFor,
  chapters,
  filled,
  placesOf,
  sections,
};
export type { Binding };
