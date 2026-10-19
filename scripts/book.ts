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
const short = (r: Range): string => r.from.split(".").slice(0, 2).join(".");

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

// A table of messages keeps the columns that hold for this range, and the rows
// of messages the range has.
function narrow(table: string, range: Range): string {
  const rows = table.split("\n").filter((l) => l.startsWith("|"));
  const cells = (row: string): string[] =>
    row
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
  const head = cells(rows[0] ?? "");
  const own = head.indexOf(short(range));
  if (own === -1) return table;
  const keep = head
    .map((_, i) => i)
    .filter((i) => i < 2 || i === own || i === head.length - 1);
  const pick = (row: string): string =>
    `| ${keep.map((i) => cells(row)[i] ?? "").join(" | ")} |`;
  const body = rows.slice(2).filter((row) => cells(row)[own] !== "none");
  const title = (i: number): string =>
    i === own ? "Command" : (head[i] ?? "");
  // Dashes set each column's share of the width, and the colons align it left.
  const share = [28, 8, 18, 46];
  const rule = keep
    .map((_, i) => `:${"-".repeat(share[i] ?? 10)}`)
    .join(" | ");
  return [
    `| ${keep.map(title).join(" | ")} |`,
    `| ${rule} |`,
    ...body.map(pick),
  ].join("\n");
}

function chapterFor(chapter: string, range: Range): string {
  let text = read(`spec/${chapter}.md`);
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
    (_, table: string) => narrow(table.trim(), range),
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

mkdirSync(join(ROOT, "dist", "book"), { recursive: true });
for (const range of ranges) {
  const span =
    range.until === undefined
      ? `${range.from} on`
      : `${range.from} up to ${range.until}`;
  const front = [
    "---",
    `title: "Trueshot ${short(range)}"`,
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
