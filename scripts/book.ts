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
import { covers, ranges as coveredRanges } from "./schema.ts";
import type { Ranged } from "./schema.ts";
import { seasonOf, seasons } from "./seasons.ts";
import { anchorOf, messages, spanName } from "./tables.ts";

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

// The ranges a part holds for, as the site's build picker reads them: spans
// of ranges that follow one another, from:until, separated by semicolons.
function tagOf(here: readonly Ranged[]): string {
  const spans: { from: string; until: string }[] = [];
  for (const r of here) {
    const last = spans[spans.length - 1];
    if (last !== undefined && last.until === r.from)
      last.until = r.until ?? "";
    else spans.push({ from: r.from, until: r.until ?? "" });
  }
  return spans.map((x) => `${x.from}:${x.until}`).join(";");
}

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
    // A passage that holds for every range of the book reads as the rest of
    // the chapter does there.
    text = text.replace(
      p.whole,
      here.length === 0
        ? ""
        : here.length === own.length
          ? `${p.body}\n`
          : [
              `<div class="build" data-ranges="${tagOf(here)}">`,
              "",
              [`**In ${spanName(here, ranges)}**`, "", p.body]
                .join("\n")
                .split("\n")
                .map((l) => (l === "" ? ">" : `> ${l}`))
                .join("\n"),
              "",
              "</div>",
            ].join("\n"),
    );
  }
  // A message the book has is named by a link to its section; one no build of
  // the book has is named in code alone.
  const held = new Set(
    messages
      .filter((m) =>
        m.revisions.some((r) => own.some((x) => covers(r, x.from))),
      )
      .map((m) => m.message),
  );
  text = text
    .split(/(^```[\s\S]*?^```$)/m)
    .map((piece) =>
      piece.startsWith("```")
        ? piece
        : piece.replace(
            /(?<![[`\w])`([A-Z][A-Za-z0-9]+)`(?![\]`(])/g,
            (whole, name: string) =>
              held.has(name) ? `[\`${name}\`](#${anchorOf(name)})` : whole,
          ),
    )
    .join("");
  const marks: [RegExp, string, string][] = [
    [MESSAGES, "Messages", `messages/${chapter}`],
    [/^<!-- protocol -->$/m, "Packet headers and constants", "protocol"],
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
  // A system's chapter stays out of a book none of whose ranges carry any of
  // its messages: there is nothing in it the book's builds do.
  const shown = chapters.filter(
    (c) =>
      !(
        systems.includes(c) &&
        part(season.folder, `messages/${c}`).trim() === ""
      ),
  );
  for (const c of shown)
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
    ...shown.map((c) => `1. [${title(`${c}.md`)}](${c}.md)`),
    "",
    "# Appendices",
    "",
    ...["structs.md", "patches.md", "message-index.md"].map(
      (p) => `- [${title(p)}](${p})`,
    ),
  ].join("\n");
  const dir = join(ROOT, "dist", "books", season.folder);
  mkdirSync(join(dir, "src"), { recursive: true });
  // A link to a chapter the book leaves out keeps only its words.
  const left = chapters.filter((c) => !shown.includes(c));
  for (const [page, text] of pages)
    pages.set(
      page,
      text.replace(
        /\[([^\]]+)\]\(([a-z-]+)\.md(?:#[^)]*)?\)/g,
        (whole, words: string, c: string) =>
          left.includes(c) ? words : whole,
      ),
    );
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
      'additional-js = ["home.js", "build.js"]',
      'additional-css = ["home.css"]',
      "",
    ].join("\n"),
  );
  // The book's title in the bar leads back to the home page that lists every
  // season, which sits one level above each book.
  writeFileSync(
    join(dir, "home.js"),
    [
      "document.addEventListener('DOMContentLoaded', () => {",
      "  const title = document.querySelector('.menu-title');",
      "  if (title === null) return;",
      "  const home = document.createElement('a');",
      "  home.href = (typeof path_to_root === 'string' ? path_to_root : '') + '../';",
      "  home.title = 'Every season';",
      "  home.className = 'home';",
      "  home.textContent = title.textContent;",
      "  title.textContent = '';",
      "  title.appendChild(home);",
      "});",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(dir, "home.css"),
    [
      ".menu-title a.home { color: inherit; text-decoration: none; }",
      ".menu-title a.home:hover { text-decoration: underline; }",
      ".build-pick { margin: 0 8px; font-size: 1.4rem; }",
      ".build-pick select { font: inherit; color: var(--fg); background: var(--bg); border: 1px solid var(--theme-popup-border); border-radius: 4px; padding: 2px 4px; }",
      "",
    ].join("\n"),
  );
  // A picker in the bar narrows the book to one range: every part tagged
  // with ranges that do not hold it is hidden. Without scripts, and in print,
  // the whole book shows, each part under the heading naming its ranges.
  const picks = own.map((r) => ({
    name: spanName([r], ranges),
    from: r.from,
  }));
  writeFileSync(
    join(dir, "build.js"),
    [
      `const RANGES = ${JSON.stringify(picks)};`,
      `const STORE = "trueshot-build-${season.folder}";`,
      "const parts = (v) => v.split('.').map(Number);",
      "const before = (a, b) => {",
      "  const x = parts(a), y = parts(b);",
      "  for (let i = 0; i < Math.max(x.length, y.length); i++) {",
      "    const d = (x[i] ?? 0) - (y[i] ?? 0);",
      "    if (d !== 0) return d < 0;",
      "  }",
      "  return false;",
      "};",
      "const holds = (tag, build) =>",
      "  tag.split(';').some((p) => {",
      "    const [from, until] = p.split(':');",
      "    return !before(build, from) && (until === '' || before(build, until));",
      "  });",
      "function apply(build) {",
      "  for (const el of document.querySelectorAll('.build[data-ranges]'))",
      "    el.hidden = build !== '' && !holds(el.dataset.ranges, build);",
      "}",
      "document.addEventListener('DOMContentLoaded', () => {",
      "  const bar = document.querySelector('.right-buttons');",
      "  if (bar === null || RANGES.length < 2) return;",
      "  const label = document.createElement('label');",
      "  label.className = 'build-pick';",
      "  label.textContent = 'Build ';",
      "  const pick = document.createElement('select');",
      "  pick.add(new Option('Every build', ''));",
      "  for (const r of RANGES) pick.add(new Option(r.name, r.from));",
      "  let saved = '';",
      "  try { saved = localStorage.getItem(STORE) ?? ''; } catch {}",
      "  if (RANGES.some((r) => r.from === saved)) pick.value = saved;",
      "  pick.addEventListener('change', () => {",
      "    try { localStorage.setItem(STORE, pick.value); } catch {}",
      "    apply(pick.value);",
      "  });",
      "  label.appendChild(pick);",
      "  bar.prepend(label);",
      "  apply(pick.value);",
      "});",
      "",
    ].join("\n"),
  );
  console.log("wrote", dir);
}
