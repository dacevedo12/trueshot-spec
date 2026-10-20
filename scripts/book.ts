// One book per range of versions, put together from the specification.
//
//   bun scripts/book.ts          write dist/site/<season>/<range>/book.md
//   bun scripts/book.ts --pdf    and book.pdf beside it, with pandoc and typst
//   bun scripts/book.ts --check  only check that every binding has its place
//
// A book takes the chapters in the order spec/README.md reads them, sets each
// binding's entries in their places (see scripts/bindings.ts), puts the
// system's messages with their commands in that range at the
// `<!-- messages -->` line of each system's chapter, and ends with the range's
// messages page, which scripts/site.ts writes first.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  ANCHOR,
  appliesTo,
  bindings,
  bindingsFor,
  chapters,
  placesOf,
  sections,
} from "./bindings.ts";
import { ranges as coveredRanges } from "./schema.ts";
import type { Ranged } from "./schema.ts";
import { folderOf } from "./seasons.ts";
import { rangeName, rangeTable } from "./tables.ts";

type Range = Ranged;

const ROOT = join(import.meta.dir, "..");
const REPOSITORY = "https://github.com/dacevedo12/trueshot-spec/blob/main";
const check = process.argv.includes("--check");
const pdf = process.argv.includes("--pdf");
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

const ranges: Range[] = coveredRanges();
const MESSAGES = /^<!-- messages -->$/m;
const systems = (
  JSON.parse(read("schema/meta/message.json")) as {
    properties: { system: { enum: string[] } };
  }
).properties.system.enum;

const problems: string[] = [];

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
    const places = placesOf(chapter);
    for (const key of sections(`${b.dir}/${file}`, problems).keys()) {
      if (!places.includes(key))
        problems.push(
          `${b.dir}/${file}: "${key}" has no place in spec/${chapter}.md`,
        );
    }
  }
}
for (const chapter of chapters) {
  const places = placesOf(chapter);
  const twice = places.filter((p, i) => places.indexOf(p) !== i);
  for (const p of new Set(twice))
    problems.push(`spec/${chapter}.md: the place "${p}" is named twice`);
}
// Every system has a chapter in the reading order, with a place for its
// messages, and every range has a season.
for (const s of systems) {
  if (!chapters.includes(s)) {
    problems.push(
      `spec/${s}.md: every system has a chapter in the reading order`,
    );
    continue;
  }
  if (!MESSAGES.test(read(`spec/${s}.md`)))
    problems.push(`spec/${s}.md: no <!-- messages --> line`);
}
for (const r of ranges) {
  try {
    folderOf(r);
  } catch (e) {
    problems.push((e as Error).message);
  }
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
    if (/^dist\/site\/.*\/messages\.md$/.test(resolved))
      return "](#appendix-messages)";
    return `](${REPOSITORY}/${resolved}${fragment === undefined ? "" : `#${fragment}`})`;
  });
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
    MESSAGES,
    () =>
      `## Messages\n\n${rangeTable(chapter, range, "../schema/messages/")}`,
  );
  text = text.replace(/^# (.+)$/m, `# $1 {#chapter-${chapter}}`);
  return relink(text, "spec");
}

function appendix(range: Range): string {
  const dir = `dist/site/${folderOf(range)}`;
  if (!existsSync(join(ROOT, dir, "messages.md"))) {
    console.error(
      `${dir}/messages.md is missing: run bun scripts/site.ts first`,
    );
    process.exit(1);
  }
  const text = read(`${dir}/messages.md`).replace(
    /^# .+$/m,
    "# Messages {#appendix-messages}",
  );
  return relink(text, dir);
}

// The opening every book shares: the order the chapters fall in, from
// spec/README.md, then the advice of IMPLEMENTING.md on checking work and on
// gaps.
const preface = ((): string => {
  const reading = read("spec/README.md").split("## Reading order")[1] ?? "";
  const intro = read("IMPLEMENTING.md");
  const blocks = reading.split(/\n\n+/).map((b) => b.trim());
  const parts = blocks.flatMap((lead, i) => {
    if (!lead.endsWith(":")) return [];
    const named = [
      ...(blocks[i + 1] ?? "").matchAll(/\[([^\]]+)\]\(([a-z-]+)\.md\)/g),
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
  const out = join(ROOT, "dist", "site", folderOf(range), "book.md");
  mkdirSync(join(out, ".."), { recursive: true });
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
