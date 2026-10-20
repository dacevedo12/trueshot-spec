// The site as web pages, for GitHub Pages: a home page linking each season's
// book, and the books, which mdBook builds.
//
//   bun scripts/pages.ts   write dist/site from dist/books
//
// `bun run books` runs it after the books are put together. Each book is
// built into dist/site/<season>/; a
// reader prints one, or saves it as a PDF, from its print page.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { seasons } from "./seasons.ts";

const ROOT = join(import.meta.dir, "..");
const BOOKS = join(ROOT, "dist", "books");
const OUT = join(ROOT, "dist", "site");

if (!existsSync(BOOKS)) {
  console.error("dist/books is missing: run bun run books");
  process.exit(1);
}
const held = seasons.filter((s) => existsSync(join(BOOKS, s.folder)));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const s of held) {
  const made = Bun.spawnSync(
    [
      "mdbook",
      "build",
      join(BOOKS, s.folder),
      "--dest-dir",
      join(OUT, s.folder),
    ],
    { stdout: "inherit", stderr: "inherit" },
  );
  if (made.exitCode !== 0) process.exit(made.exitCode);
}

// The home page names the specification and links each book, and nothing
// else; it follows the books' own light and dark themes.
const escape = (t: string): string =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
writeFileSync(
  join(OUT, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trueshot</title>
<style>
:root { --bg: #ffffff; --fg: #333333; --muted: #6e6e6e; --link: #4183c4; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #161923; --fg: #bcbdd0; --muted: #8b8fa3; --link: #2b79a2; color-scheme: dark; }
}
body { margin: 0; background: var(--bg); color: var(--fg);
  font: 16px/1.6 "Open Sans", system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 640px; margin: 0 auto; padding: 64px max(16px, env(safe-area-inset-left, 0px)) 48px; }
h1 { font-size: 2.2rem; margin: 0 0 8px; }
p { color: var(--muted); margin: 0 0 32px; }
ul { list-style: none; padding: 0; margin: 0; }
li { margin: 0 0 12px; font-size: 1.25rem; }
a { color: var(--link); }
</style>
</head>
<body>
<main>
<h1>Trueshot</h1>
<p>A wire protocol specification for League of Legends game servers, with one book for each season it covers.</p>
<ul>
${held.map((s) => `<li><a href="${s.folder}/">${escape(s.name)}</a></li>`).join("\n")}
</ul>
</main>
</body>
</html>
`,
);
console.log(
  `built ${held.length} books into dist/site: ${readdirSync(OUT).join(", ")}`,
);
