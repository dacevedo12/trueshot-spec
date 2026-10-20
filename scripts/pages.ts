// The site as web pages, for GitHub Pages: a home page and a book for each
// season, rendered from dist/site.
//
//   bun scripts/pages.ts             write dist/pages from dist/site
//   bun scripts/pages.ts --fragment  leave the home page without its document
//                                    shell, for a host that adds its own
//
// Run `bun run site` first. index.md becomes index.html and each season's
// book <season>.html, with its PDF beside it where the site was built with
// one. The books already link the repository on GitHub, and the home page's
// links to a book follow it into HTML. Pages are rendered by pandoc, through
// scripts/pages/page.html and scripts/pages/filter.lua.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SITE = join(ROOT, "dist", "site");
const OUT = join(ROOT, "dist", "pages");
const fragment = process.argv.includes("--fragment");

if (!existsSync(join(SITE, "index.md"))) {
  console.error("dist/site is missing: run bun run site first");
  process.exit(1);
}

// Only the pages themselves: the parts a book is put together from stay out.
const pages = readdirSync(SITE)
  .filter((f) => f.endsWith(".md"))
  .sort();
const books = pages.filter((p) => p !== "index.md");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "assets"), { recursive: true });
copyFileSync(
  join(ROOT, "scripts/pages/site.css"),
  join(OUT, "assets/site.css"),
);

const TEMPLATE = join(ROOT, "scripts/pages/page.html");
const render = async (page: string): Promise<void> => {
  const book = page !== "index.md";
  const source = readFileSync(join(SITE, page), "utf8")
    // A link to a book goes to its page; a PDF is linked only where one is.
    .replace(/\]\(([a-z0-9-]+)\.md(#[^)]*)?\)/g, "]($1.html$2)")
    .replace(/ \(\[PDF\]\(([a-z0-9-]+\.pdf)\)\)/g, (whole, pdf: string) =>
      existsSync(join(SITE, pdf)) ? whole : "",
    );
  const title = (/^title: "(.+)"$/m.exec(source)?.[1] ?? "").replace(
    /^Trueshot /,
    "",
  );
  const pdf = page.replace(/\.md$/, ".pdf");
  const args = [
    "pandoc",
    "--from=markdown-smart",
    "--to=html5",
    `--template=${TEMPLATE}`,
    "--quiet",
    "--columns=100000",
    "--variable=root:",
    `--lua-filter=${join(ROOT, "scripts/pages/filter.lua")}`,
    ...(book
      ? [
          `--variable=page-title:${title}`,
          `--variable=crumbs:<span>${title}</span>${existsSync(join(SITE, pdf)) ? `<span><a href="${pdf}">PDF</a></span>` : ""}`,
          "--variable=wide",
          "--toc",
          "--toc-depth=2",
          "--number-sections",
        ]
      : []),
    ...(fragment && !book ? ["--variable=fragment"] : []),
    `--output=${join(OUT, page.replace(/\.md$/, ".html"))}`,
  ];
  const run = Bun.spawn(args, { stdin: "pipe", stderr: "inherit" });
  run.stdin.write(source);
  await run.stdin.end();
  if ((await run.exited) !== 0) throw new Error(`pandoc failed on ${page}`);
};
await Promise.all(pages.map(render));

for (const f of readdirSync(SITE))
  if (f.endsWith(".pdf")) copyFileSync(join(SITE, f), join(OUT, f));
console.log(`wrote the home page and ${books.length} books to dist/pages`);
