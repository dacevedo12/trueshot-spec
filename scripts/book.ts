// One book per range of versions, put together from the specification.
//
//   bun scripts/book.ts          write dist/book/<range>.md
//   bun scripts/book.ts --pdf    and dist/book/<range>.pdf, with pandoc and typst
//   bun scripts/book.ts --check  only check that every binding has its place
//
// The chapters under spec/ are the core, which holds for every range. What a
// range alone does lives in spec/bindings/<range>/<chapter>.md, as entries
// that each begin with a `<!-- place: name -->` line naming the place in the
// chapter it fills: a `<!-- binding: name -->` line. A book takes the
// chapters in the order IMPLEMENTING.md reads them, sets each binding's
// entries in their places, keeps only its own range in each table of messages, and ends with
// the range's reference page.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { compare, ranges as coveredRanges } from "./schema.ts";
import { rangeName, rangeTable } from "./tables.ts";

interface Range {
  readonly from: string;
  readonly until?: string;
}

const ROOT = join(import.meta.dir, "..");
const REPOSITORY = "https://github.com/dacevedo12/trueshot-spec/blob/main";
const check = process.argv.includes("--check");
const pdf = process.argv.includes("--pdf");
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

const ranges: Range[] = coveredRanges();
const slug = (build: string): string => build.replace(/\./g, "-");

// The chapters, in the order IMPLEMENTING.md gives them.
const order = read("IMPLEMENTING.md").split("## Reading order")[1] ?? "";
const chapters = [
  ...new Set(
    [...order.matchAll(/\]\(spec\/([a-z-]+)\.md\)/g)].map((m) => m[1] ?? ""),
  ),
];

const problems: string[] = [];
const ANCHOR = /^<!-- binding: ([a-z][a-z0-9-]*) -->$/gm;

// The entries of one binding file, by the place each fills. An entry begins
// at a `<!-- place: name -->` line and runs to the next, so it can hold
// headings and lists of its own; the file's title is the chapter's.
const PLACE = /^<!-- place: ([a-z][a-z0-9-]*) -->$/m;
function sections(path: string): Map<string, string> {
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
const bindings: Binding[] = (
  existsSync(join(ROOT, "spec/bindings"))
    ? readdirSync(join(ROOT, "spec/bindings")).sort()
    : []
).map((name) => {
  const [from = "", until] = name.split("--");
  return {
    dir: `spec/bindings/${name}`,
    from: unslug(from),
    ...(until === undefined ? {} : { until: unslug(until) }),
  };
});
const appliesTo = (b: Binding, r: Range): boolean =>
  b.until === undefined
    ? b.from === r.from
    : compare(r.from, b.from) >= 0 &&
      r.until !== undefined &&
      compare(r.until, b.until) <= 0;
// Spans first, then the range's own, so the narrower says the last word.
const bindingsFor = (r: Range): Binding[] =>
  bindings
    .filter((b) => appliesTo(b, r))
    .sort(
      (x, y) =>
        (x.until === undefined ? 1 : 0) - (y.until === undefined ? 1 : 0),
    );

// Every binding names ranges that exist, its entries have a place in their
// chapter, and every place is named once.
for (const b of bindings) {
  if (!ranges.some((r) => appliesTo(b, r)))
    problems.push(
      `${b.dir}: no range starts at that build, or lies in that span`,
    );
  for (const file of readdirSync(join(ROOT, b.dir))) {
    const chapter = file.replace(/\.md$/, "");
    if (!chapters.includes(chapter)) {
      problems.push(
        `${b.dir}/${file}: no chapter spec/${chapter}.md in the reading order`,
      );
      continue;
    }
    const places = [...read(`spec/${chapter}.md`).matchAll(ANCHOR)].map(
      (m) => m[1],
    );
    for (const key of sections(`${b.dir}/${file}`).keys()) {
      if (!places.includes(key))
        problems.push(
          `${b.dir}/${file}: "${key}" has no place in spec/${chapter}.md`,
        );
    }
  }
}
for (const chapter of chapters) {
  const places = [...read(`spec/${chapter}.md`).matchAll(ANCHOR)].map(
    (m) => m[1],
  );
  const twice = places.filter((p, i) => places.indexOf(p) !== i);
  for (const p of new Set(twice))
    problems.push(`spec/${chapter}.md: the place "${p}" is named twice`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
if (check) {
  console.log(
    `Every binding has its place, across ${chapters.length} chapters and ${ranges.length} ranges.`,
  );
  process.exit(0);
}

// A link between chapters becomes a link within the book, and a link to a
// definition or a vector becomes one to the repository.
function relink(text: string, base: string): string {
  return text.replace(/\]\(([^)\s]+)\)/g, (whole, target: string) => {
    if (/^[a-z]+:/.test(target) || target.startsWith("#")) return whole;
    const [path = "", fragment] = target.split("#");
    const resolved = join(base, path).replace(/\\/g, "/");
    const chapter = /^spec\/([a-z-]+)\.md$/.exec(resolved)?.[1];
    if (chapter !== undefined && chapters.includes(chapter)) {
      return `](#${fragment ?? `chapter-${chapter}`})`;
    }
    const reference = /^spec\/reference\/([0-9-]+)\.md$/.exec(resolved)?.[1];
    if (reference !== undefined) return "](#appendix-messages)";
    return `](${REPOSITORY}/${resolved}${fragment === undefined ? "" : `#${fragment}`})`;
  });
}

function chapterFor(chapter: string, range: Range): string {
  let text = read(`spec/${chapter}.md`);
  // The line pointing a reader on the repository at the bindings goes; the
  // book sets the entries in place.
  text = text.replace(/^<!-- by range -->.*\n/gm, "");
  // A binding's links are written from where the binding sits.
  const entries = bindingsFor(range).map((b) => ({
    base: b.dir,
    own: sections(`${b.dir}/${chapter}.md`),
  }));
  text = text.replace(ANCHOR, (_, key: string) =>
    entries
      .map(({ base, own }) => relink(own.get(key) ?? "", base))
      .filter((t) => t !== "")
      .join("\n\n"),
  );
  // A chapter not yet split into core and bindings still names its ranges.
  text = text.replace(
    / ?Applies to [0-9. and]+ clients, as \[Versions\]\(versions\.md\) describes\./g,
    "",
  );
  text = text.replace(
    /<!-- messages:begin -->([\s\S]*?)<!-- messages:end -->/,
    () => rangeTable(chapter, range, "../schema/messages/"),
  );
  text = text.replace(/^# (.+)$/m, `# $1 {#chapter-${chapter}}`);
  return relink(text, "spec");
}

function appendix(range: Range): string {
  const path = `spec/reference/${slug(range.from)}.md`;
  const text = read(path)
    .replace(/^# .+$/m, "# Messages {#appendix-messages}")
    .replace(/^Generated from .*?: do not edit by hand\. /m, "");
  return relink(text, "spec/reference");
}

// The opening every book shares, from IMPLEMENTING.md: the order the
// chapters fall in, then its advice on checking work and on gaps.
const preface = ((): string => {
  const [intro = "", reading = ""] =
    read("IMPLEMENTING.md").split("## Reading order");
  const blocks = reading.split(/\n\n+/).map((b) => b.trim());
  const parts = blocks.flatMap((lead, i) => {
    if (!lead.endsWith(":")) return [];
    const named = [
      ...(blocks[i + 1] ?? "").matchAll(
        /\[([^\]]+)\]\(spec\/([a-z-]+)\.md\)/g,
      ),
    ]
      .map((m) => ({ title: m[1] ?? "", chapter: m[2] ?? "" }))
      .filter((c) => c.chapter !== "versions");
    const first = named[0];
    const last = named[named.length - 1];
    if (first === undefined || last === undefined) return [];
    const link = (c: { title: string; chapter: string }): string =>
      `[${c.title}](#chapter-${c.chapter})`;
    const span =
      first === last ? link(first) : `${link(first)} to ${link(last)}`;
    return [`- ${lead.replace(/\s+/g, " ")} ${span}.`];
  });
  const advice = intro
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter((b) =>
      /^(Check your work|Field layouts|If the specification)/.test(b),
    );
  return relink(
    [
      "The chapters run in this order:",
      "",
      ...parts,
      "",
      advice.join("\n\n"),
    ].join("\n"),
    ".",
  );
})();

mkdirSync(join(ROOT, "dist", "book"), { recursive: true });
for (const range of ranges) {
  const span =
    range.until === undefined
      ? `${range.from} on`
      : `${range.from} up to ${range.until}`;
  const front = [
    "---",
    `title: "Trueshot ${rangeName(range)}"`,
    `subtitle: "The wire protocol of client builds ${span}"`,
    "toc: true",
    "---",
    "",
    // Raw typesetting rules at the head of the body, after the template's own,
    // so these take precedence: a chapter opens a page, and a table breaks
    // across pages and is set ragged.
    "```{=typst}",
    "#show heading.where(level: 1): it => pagebreak(weak: true) + it",
    "#show figure: set block(breakable: true)",
    "#show table: set par(justify: false)",
    "```",
    "",
  ].join("\n");
  // Versions says how the repository covers many ranges; a book covers one,
  // and says which in its own opening instead.
  const about = [
    "# About this book {#chapter-versions}",
    "",
    `This book covers client builds ${span}, and every statement in it holds for`,
    "each of them. It is put together from the specification's chapters, with",
    "what these builds alone do set in place, and it ends with every message they",
    "send or take. The definitions it links to are the record it is drawn from.",
    "",
    preface,
  ].join("\n");
  const body = [
    about,
    ...chapters
      .filter((c) => c !== "versions")
      .map((c) => chapterFor(c, range)),
  ].join("\n\n");
  const out = join(ROOT, "dist", "book", `${slug(range.from)}.md`);
  writeFileSync(out, `${front}\n${body}\n\n${appendix(range)}`);
  console.log("wrote", out);
  if (pdf) {
    const made = Bun.spawnSync(
      [
        "pandoc",
        out,
        "--pdf-engine=typst",
        "--number-sections",
        "-V",
        "section-numbering=1.1.1",
        "-V",
        "mainfont=Libertinus Serif",
        "-V",
        "codefont=DejaVu Sans Mono",
        "-o",
        out.replace(/\.md$/, ".pdf"),
      ],
      {
        stderr: "inherit",
      },
    );
    if (made.exitCode !== 0) process.exit(made.exitCode);
    console.log("wrote", out.replace(/\.md$/, ".pdf"));
  }
}
