// One book per season, put together from the specification as an mdBook.
//
//   bun scripts/book.ts          write dist/books/<season>/
//   bun scripts/book.ts --check  only check the chapters' passages and marks
//   bun scripts/book.ts --fix    write each passage's heading from its builds
//
// A book takes the chapters in the order spec/README.md reads them, a page
// each, keeping each passage that holds for some of the season's ranges,
// headed with those ranges, and leaving out the rest (see scripts/passages.ts).
// At each system's `<!-- messages -->` line it sets the system's messages with
// every layout they have in the season, and at the `<!-- channels -->` and
// `<!-- families -->` lines the channels and family headers. It ends with the
// appendices. scripts/parts.ts writes these parts first, under
// dist/parts/<season>/, and scripts/pages.ts builds the books.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { chapters, holdsFor, passagesOf } from "./passages.ts";
import { ranges as coveredRanges } from "./schema.ts";
import type { Ranged } from "./schema.ts";
import { seasonOf, seasons } from "./seasons.ts";
import { spanName } from "./tables.ts";

type Range = Ranged;

const ROOT = join(import.meta.dir, "..");
const REPOSITORY = "https://github.com/dacevedo12/trueshot-spec/blob/main";
const check = process.argv.includes("--check");
const fix = process.argv.includes("--fix");
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

// A link between chapters becomes a link to the chapter's page, and a link
// to a definition or a vector becomes one to the repository.
function relink(text: string, base: string): string {
  return text.replace(/\]\(([^)\s]+)\)/g, (whole, target: string) => {
    if (/^[a-z]+:/.test(target) || target.startsWith("#")) return whole;
    const [path = "", fragment] = target.split("#");
    const resolved = join(base, path).replace(/\\/g, "/");
    const chapter = /^spec\/([a-z-]+)\.md$/.exec(resolved)?.[1];
    if (chapter !== undefined && chapters.includes(chapter))
      return `](${chapter}.md${fragment === undefined ? "" : `#${fragment}`})`;
    return `](${REPOSITORY}/${resolved}${fragment === undefined ? "" : `#${fragment}`})`;
  });
}

const part = (season: string, name: string): string => {
  const path = `dist/parts/${season}/${name}.md`;
  if (!existsSync(join(ROOT, path))) {
    console.error(`${path} is missing: run bun scripts/parts.ts first`);
    process.exit(1);
  }
  return read(path);
};

// A chapter as a season reads it: each passage that holds for some of its
// ranges, headed with those, and none of the others, with what the
// definitions give set at its marks: a system's messages, the channels and
// the family headers.
function chapterFor(
  chapter: string,
  season: string,
  own: readonly Range[],
): string {
  let text = read(`spec/${chapter}.md`);
  for (const p of passagesOf(chapter)) {
    const here = own.filter((r) => holdsFor(p, r));
    text = text.replace(
      p.whole,
      here.length === 0
        ? ""
        : [`**In ${spanName(here, ranges)}**`, "", p.body]
            .join("\n")
            .split("\n")
            .map((l) => (l === "" ? ">" : `> ${l}`))
            .join("\n"),
    );
  }
  const marks: [RegExp, string, string][] = [
    [MESSAGES, "Messages", `messages/${chapter}`],
    [/^<!-- channels -->$/m, "Channels", "channels"],
    [/^<!-- families -->$/m, "Family headers", "families"],
  ];
  for (const [mark, title, name] of marks)
    text = text.replace(mark, () => {
      const body = part(season, name).trim();
      return body === "" ? "" : `## ${title}\n\n${body}`;
    });
  return relink(text.replace(/\n{3,}/g, "\n\n"), "spec");
}

// What every book says before its chapters: the opening of spec/README.md,
// which is the specification's own introduction.
const introduction = relink(
  (read("spec/README.md").split("## Reading order")[0] ?? "")
    .replace(/^# .+\n/, "")
    .trim(),
  "spec",
);

// Links within a book name the page an anchor is on, since each chapter and
// appendix is a page of its own.
function anchored(pages: Map<string, string>): Map<string, string> {
  const home = new Map<string, string>();
  for (const [page, text] of pages)
    for (const m of text.matchAll(/\{#([a-z0-9-]+)\}/g))
      home.set(m[1] ?? "", page);
  const out = new Map<string, string>();
  for (const [page, text] of pages)
    out.set(
      page,
      text.replace(/\]\(#([a-z0-9-]+)\)/g, (whole, id: string) => {
        const at = home.get(id);
        return at === undefined || at === page ? whole : `](${at}#${id})`;
      }),
    );
  return out;
}

rmSync(join(ROOT, "dist", "books"), { recursive: true, force: true });
for (const season of seasons) {
  const own = ranges.filter((r) => seasonOf(r) === season);
  if (own.length === 0) continue;
  const pages = new Map<string, string>();
  pages.set(
    "about.md",
    [
      "# About this book",
      "",
      introduction,
      "",
      part(season.folder, "about"),
    ].join("\n"),
  );
  for (const c of chapters)
    pages.set(`${c}.md`, chapterFor(c, season.folder, own));
  pages.set("structs.md", part(season.folder, "structs"));
  pages.set("patches.md", part(season.folder, "patches"));
  pages.set("message-index.md", part(season.folder, "index"));
  const title = (page: string): string =>
    /^# (.+?)(?: \{#.*\})?$/m.exec(pages.get(page) ?? "")?.[1] ?? page;
  const summary = [
    "# Summary",
    "",
    `[${title("about.md")}](about.md)`,
    "",
    ...chapters.map((c) => `1. [${title(`${c}.md`)}](${c}.md)`),
    "",
    "# Appendices",
    "",
    ...["structs.md", "patches.md", "message-index.md"].map(
      (p) => `- [${title(p)}](${p})`,
    ),
  ].join("\n");
  const dir = join(ROOT, "dist", "books", season.folder);
  mkdirSync(join(dir, "src"), { recursive: true });
  for (const [page, text] of anchored(pages))
    writeFileSync(join(dir, "src", page), `${text.trim()}\n`);
  writeFileSync(join(dir, "src", "SUMMARY.md"), `${summary}\n`);
  writeFileSync(
    join(dir, "book.toml"),
    [
      "[book]",
      `title = "Trueshot ${season.name}"`,
      'language = "en"',
      "",
      "[output.html]",
      `git-repository-url = "${REPOSITORY.replace(/\/blob\/main$/, "")}"`,
      'default-theme = "light"',
      'preferred-dark-theme = "navy"',
      // Where GitHub Pages serves the book, which its not-found page links from.
      `site-url = "/${REPOSITORY.split("/")[4]}/${season.folder}/"`,
      "",
    ].join("\n"),
  );
  console.log("wrote", dir);
}
