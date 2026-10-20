// The site as web pages, for GitHub Pages: dist/site turned into HTML.
//
//   bun scripts/pages.ts             write dist/pages from dist/site
//   bun scripts/pages.ts --fragment  leave the home page without its document
//                                    shell, for a host that adds its own
//
// Run `bun run site` first. Every page keeps its place: README.md becomes
// index.html and any other page the same name in .html. A link between pages
// follows them, and a link into the repository, to a definition, a vector or
// a chapter, goes to the repository on GitHub, since the pages are served
// apart from it. Pages are rendered by pandoc, through scripts/pages/page.html.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { dirname, join, posix } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SITE = join(ROOT, "dist", "site");
const OUT = join(ROOT, "dist", "pages");
const REPOSITORY = "https://github.com/dacevedo12/trueshot-spec";
const fragment = process.argv.includes("--fragment");

if (!existsSync(join(SITE, "README.md"))) {
  console.error("dist/site is missing: run bun run site first");
  process.exit(1);
}

const pages = readdirSync(SITE, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith(".md"))
  .sort();
const htmlOf = (page: string): string =>
  page.replace(/(^|\/)README\.md$/, "$1index.html").replace(/\.md$/, ".html");

// A link as the page it sits on resolves it: to another page, to a file
// beside the pages, or out of them into the repository.
function relink(text: string, page: string): string {
  const dir = posix.dirname(page);
  return text.replace(/\]\(([^)\s]+)\)/g, (whole, target: string) => {
    if (/^[a-z]+:/.test(target) || target.startsWith("#")) return whole;
    const [path = "", anchor] = target.split("#");
    const tail = anchor === undefined ? "" : `#${anchor}`;
    const resolved = posix.normalize(posix.join(dir, path));
    if (resolved.startsWith("../")) {
      const inRepo = posix.normalize(posix.join("dist/site", resolved));
      const clean = inRepo.replace(/\/$/, "");
      const where =
        clean === "."
          ? ""
          : `/${path.endsWith("/") ? "tree" : "blob"}/main/${clean}`;
      return `](${REPOSITORY}${where}${tail})`;
    }
    return path.endsWith(".md")
      ? `](${htmlOf(path)}${tail})`
      : path.endsWith("/")
        ? `](${path}index.html${tail})`
        : whole;
  });
}

// What a page's bar shows: the way back to its season and range, and, on a
// range's own pages, the four of them.
const RANGE_PAGES: [string, string][] = [
  ["README.md", "Overview"],
  ["changes.md", "Against the range before"],
  ["messages.md", "Messages"],
  ["book.md", "Book"],
];
function chrome(page: string): { crumbs: string; tabs: string } {
  const parts = page.split("/");
  const root = "../".repeat(parts.length - 1);
  const title = (md: string): string =>
    /^# (.+)$/m.exec(readFileSync(join(SITE, md), "utf8"))?.[1] ?? md;
  const crumbs: string[] = [];
  if (parts.length >= 2) {
    const season = `${parts[0]}/README.md`;
    crumbs.push(
      `<span><a href="${root}${htmlOf(season)}">${title(season)}</a></span>`,
    );
  }
  if (parts.length === 3) {
    const range = `${parts[0]}/${parts[1]}/README.md`;
    crumbs.push(
      `<span><a href="${root}${htmlOf(range)}">${title(range)}</a></span>`,
    );
    const here = parts[2] ?? "";
    const tabs = RANGE_PAGES.filter(([f]) =>
      existsSync(join(SITE, parts[0] ?? "", parts[1] ?? "", f)),
    )
      .map(
        ([f, label]) =>
          `<a href="${htmlOf(f)}"${f === here ? ' aria-current="page"' : ""}>${label}</a>`,
      )
      .join("");
    return { crumbs: crumbs.join(""), tabs };
  }
  return { crumbs: crumbs.join(""), tabs: "" };
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "assets"), { recursive: true });
copyFileSync(
  join(ROOT, "scripts/pages/site.css"),
  join(OUT, "assets/site.css"),
);

const TEMPLATE = join(ROOT, "scripts/pages/page.html");
const render = async (page: string): Promise<void> => {
  const source = readFileSync(join(SITE, page), "utf8");
  const out = join(OUT, htmlOf(page));
  mkdirSync(dirname(out), { recursive: true });
  const name = posix.basename(page);
  const book = name === "book.md";
  const { crumbs, tabs } = chrome(page);
  const title =
    /^title: "(.+)"$/m.exec(source)?.[1] ??
    /^# (.+)$/m.exec(source)?.[1] ??
    "";
  const args = [
    "pandoc",
    "--from=markdown-smart",
    "--to=html5",
    `--template=${TEMPLATE}`,
    "--quiet",
    "--columns=100000",
    `--variable=root:${"../".repeat(page.split("/").length - 1)}`,
    ...(title === "Trueshot"
      ? []
      : [`--variable=page-title:${title.replace(/`/g, "")}`]),
    ...(crumbs === "" ? [] : [`--variable=crumbs:${crumbs}`]),
    ...(tabs === "" ? [] : [`--variable=tabs:${tabs}`]),
    ...(book || name === "messages.md" || name === "changes.md"
      ? ["--variable=wide"]
      : []),
    ...(book ? ["--toc", "--toc-depth=2"] : []),
    ...(fragment && page === "README.md" ? ["--variable=fragment"] : []),
    `--output=${out}`,
  ];
  const run = Bun.spawn(args, { stdin: "pipe", stderr: "inherit" });
  run.stdin.write(relink(source, page));
  await run.stdin.end();
  if ((await run.exited) !== 0) throw new Error(`pandoc failed on ${page}`);
};
for (let i = 0; i < pages.length; i += 8)
  await Promise.all(pages.slice(i, i + 8).map(render));

// The PDFs, where the site was built with them.
for (const f of readdirSync(SITE, { recursive: true }).map(String))
  if (f.endsWith(".pdf")) {
    mkdirSync(dirname(join(OUT, f)), { recursive: true });
    copyFileSync(join(SITE, f), join(OUT, f));
  }
console.log(`wrote ${pages.length} pages to dist/pages`);
