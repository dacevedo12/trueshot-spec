// Runs every check against the client the environment names and writes what
// happened to results/<build>.json (4-20-0-315.json for 4.20.0.315), which is what a range's coverage rests
// on. The file names the commit it ran at, so anyone holding the same build
// can run the same checks and compare.
//
//   bun --env-file=<your env file> run live:conform

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LOOKS } from "./capture.ts";
import { isTrial, setup } from "./client.ts";

interface Outcome {
  readonly check: string;
  readonly outcome: "passed" | "failed" | "skipped";
  readonly why?: string;
}

const HERE = join(import.meta.dir, "..");
const s = setup();
if (s === undefined) {
  console.error(
    "TRUESHOT_BUILD and TRUESHOT_CLIENT are not set; README.md says how to name a client.",
  );
  process.exit(2);
}

const git = (...args: string[]): string =>
  Bun.spawnSync(["git", ...args], { cwd: HERE })
    .stdout.toString()
    .trim();

const report = join(HERE, "captures", "junit.xml");
mkdirSync(join(HERE, "captures"), { recursive: true });
rmSync(report, { force: true });
rmSync(LOOKS, { force: true });
const run = Bun.spawn(
  [
    process.execPath,
    "test",
    "./checks",
    "--timeout",
    "600000",
    "--reporter=junit",
    `--reporter-outfile=${report}`,
  ],
  {
    cwd: HERE,
    stdout: "inherit",
    stderr: "inherit",
  },
);
await run.exited;

// The JUnit report is small and regular: one <testcase> per check, holding a
// <failure> or <skipped> where it did not pass.
const xml = readFileSync(report, "utf8");
const decode = (text: string): string =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const outcomes: Outcome[] = [];
for (const match of xml.matchAll(
  /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g,
)) {
  const attributes = match[1] ?? "";
  const inner = match[3] ?? "";
  const name = decode(/\bname="([^"]*)"/.exec(attributes)?.[1] ?? "");
  const suite = decode(/\bclassname="([^"]*)"/.exec(attributes)?.[1] ?? "");
  const failure = /<failure\b[^>]*?message="([^"]*)"/.exec(inner);
  // A suite's setup and teardown come out as checks with no name: one that
  // failed says so as the suite's setup, and one that did not is no check.
  const hook = name === "(unnamed)";
  if (hook && failure === null) continue;
  const label = hook ? "setup" : name;
  const check = suite === "" ? label : `${suite} > ${label}`;
  if (failure !== null)
    outcomes.push({ check, outcome: "failed", why: decode(failure[1] ?? "") });
  else if (/<skipped\b/.test(inner))
    outcomes.push({ check, outcome: "skipped" });
  else outcomes.push({ check, outcome: "passed" });
}

// Screenshots stay in captures/, since they show the client's own art; the
// results say what each should show, and a reviewer fills in what it did.
const looks = (() => {
  try {
    return readFileSync(LOOKS, "utf8")
      .split("\n")
      .filter((l) => l.length > 0)
      .map(
        (l) =>
          JSON.parse(l) as {
            label: string;
            expect: string;
            file: string | null;
          },
      )
      .map((l) => ({
        look: l.label,
        expect: l.expect,
        outcome: l.file === null ? "not captured" : "to review",
      }));
  } catch {
    return [];
  }
})();

const results = {
  build: s.build,
  layouts: s.layouts,
  ...(s.transport === undefined ? {} : { transport: s.transport }),
  ...(s.messages.size === 0
    ? {}
    : { messages: Object.fromEntries(s.messages) }),
  commit: git("rev-parse", "HEAD"),
  modified:
    git(
      "status",
      "--porcelain",
      "--",
      ".",
      ":!results",
      "../../schema",
      "../../scripts",
    ).length > 0,
  runtime: `bun ${Bun.version}`,
  date: new Date().toISOString().slice(0, 10),
  checks: outcomes.sort((a, b) => a.check.localeCompare(b.check)),
  looks,
};
mkdirSync(join(HERE, "results"), { recursive: true });
// Named as spec/reference names a build: its parts joined by hyphens.
// A run under another build's layouts is a trial, not coverage, so it stays
// with the captures.
const trial = isTrial(s);
const file = join(
  HERE,
  trial ? "captures" : "results",
  `${s.build.replaceAll(".", "-")}${trial ? `-as-${s.layouts.replaceAll(".", "-")}${s.transport === undefined && s.messages.size === 0 ? "" : "-mixed"}` : ""}.json`,
);
writeFileSync(file, `${JSON.stringify(results, null, 2)}\n`);
const failed = outcomes.filter((o) => o.outcome === "failed").length;
console.log(
  `${outcomes.length - failed} of ${outcomes.length} checks passed on ${s.build}; wrote ${file}`,
);
process.exit(failed === 0 ? 0 : 1);
