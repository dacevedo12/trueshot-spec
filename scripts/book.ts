// One book per season, put together from the specification.
//
//   bun scripts/book.ts          write dist/site/<season>.md
//   bun scripts/book.ts --pdf    and <season>.pdf beside it, with pandoc and typst
//   bun scripts/book.ts --check  only check the chapters' passages and places
//   bun scripts/book.ts --fix    write each passage's heading from its builds
//
// A book takes the chapters in the order spec/README.md reads them, keeping
// each passage that holds for some of the season's ranges, headed with those
// ranges, and leaving out the rest (see scripts/passages.ts). At each system's
// `<!-- messages -->` line it puts the system's messages with their commands
// by range, and it ends with the appendices scripts/site.ts writes first under
// dist/site/parts/<season>/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chapters, holdsFor, passagesOf } from "./passages.ts";
import { ranges as coveredRanges } from "./schema.ts";
import type { Ranged } from "./schema.ts";
import { seasonOf, seasons } from "./seasons.ts";
import { seasonTable, spanName } from "./tables.ts";

type Range = Ranged;

const ROOT = join(import.meta.dir, "..");
const REPOSITORY = "https://github.com/dacevedo12/trueshot-spec/blob/main";
const check = process.argv.includes("--check");
const fix = process.argv.includes("--fix");
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

// Every passage holds for some range, and its heading names the ranges its
// builds cover; --fix writes the headings that say otherwise.
for (const chapter of chapters) {
  const passages = passagesOf(chapter, problems);
  let text = read(`spec/${chapter}.md`);
  for (const p of passages) {
    const held = ranges.filter((r) => holdsFor(p, r));
    if (held.length === 0) {
      problems.push(
        `spec/${chapter}.md:${p.line}: no range lies wholly within ${p.from} up to ${p.until}`,
      );
      continue;
    }
    const label = spanName(held, ranges);
    if (label === p.label) continue;
    if (fix)
      text = text.replace(
        p.whole,
        p.whole.replace(`> **In ${p.label}**`, `> **In ${label}**`),
      );
    else
      problems.push(
        `spec/${chapter}.md:${p.line}: the passage is headed "In ${p.label}", and its builds are ${label} (bun scripts/book.ts --fix)`,
      );
  }
  if (fix) writeFileSync(join(ROOT, `spec/${chapter}.md`), text);
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
    seasonOf(r);
  } catch (e) {
    problems.push((e as Error).message);
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
if (check || fix) {
  console.log(
    `Every passage names the ranges it holds for, across ${chapters.length} chapters and ${ranges.length} ranges.`,
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
    return `](${REPOSITORY}/${resolved}${fragment === undefined ? "" : `#${fragment}`})`;
  });
}

// A chapter as a season reads it: each passage that holds for some of its
// ranges, headed with those, and none of the others, then its messages with
// their commands by range.
function chapterFor(chapter: string, season: readonly Range[]): string {
  let text = read(`spec/${chapter}.md`);
  for (const p of passagesOf(chapter)) {
    const here = season.filter((r) => holdsFor(p, r));
    text = text.replace(
      p.whole,
      here.length === 0
        ? ""
        : `::: {.ranges}\n**In ${spanName(here, ranges)}**\n\n${p.body}\n:::`,
    );
  }
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(
    MESSAGES,
    () => `## Messages\n\n${seasonTable(chapter, season, ranges)}`,
  );
  text = text.replace(/^# (.+)$/m, `# $1 {#chapter-${chapter}}`);
  return relink(text, "spec");
}

const part = (season: string, name: string): string => {
  const path = `dist/site/parts/${season}/${name}.md`;
  if (!existsSync(join(ROOT, path))) {
    console.error(`${path} is missing: run bun scripts/site.ts first`);
    process.exit(1);
  }
  return read(path);
};

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

for (const season of seasons) {
  const own = ranges.filter((r) => seasonOf(r) === season);
  if (own.length === 0) continue;
  const first = own[0]?.from ?? "";
  const last = own[own.length - 1]?.until;
  const span = last === undefined ? `${first} on` : `${first} up to ${last}`;
  const front = [
    "---",
    `title: "Trueshot ${season.name}"`,
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
  // Versions says how the repository covers many ranges; a book says which
  // it covers in its own opening instead.
  const about = [
    "# About this book {#chapter-versions}",
    "",
    part(season.folder, "about"),
    "",
    preface,
  ].join("\n");
  const body = [
    about,
    ...chapters.filter((c) => c !== "versions").map((c) => chapterFor(c, own)),
    part(season.folder, "messages"),
    part(season.folder, "patches"),
    part(season.folder, "index"),
  ].join("\n\n");
  const out = join(ROOT, "dist", "site", `${season.folder}.md`);
  mkdirSync(join(out, ".."), { recursive: true });
  writeFileSync(out, `${front}\n${body}\n`);
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
