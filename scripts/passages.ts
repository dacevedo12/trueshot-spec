// The chapters, and the passages in them that hold for some ranges alone, as
// the books, the site and the checks all read them.
//
// The chapters under spec/ hold for every range, taken in the order
// spec/README.md reads them. A passage that holds for some ranges alone is a
// quotation headed with those ranges, after a comment naming its builds:
//
//   <!-- holds from 4.1.0.171 up to 4.18.0.271 -->
//   > **In 4.1–4.17**
//   >
//   > What those ranges alone do.
//
// The comment is what the tools read, a blank line may stand between it and
// the quotation, and the heading is for a reader, which the checks hold to the
// ranges the builds cover.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compare } from "./schema.ts";
import type { Ranged } from "./schema.ts";

const ROOT = join(import.meta.dir, "..");
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

// The chapters, in the order spec/README.md gives them.
const index = read("spec/README.md").split("## Reading order")[1] ?? "";
const chapters: readonly string[] = [
  ...new Set(
    [...index.matchAll(/\]\(([a-z-]+)\.md\)/g)].map((m) => m[1] ?? ""),
  ),
];

interface Passage {
  readonly chapter: string;
  readonly from: string;
  readonly until: string;
  // The heading as written, without its `In`.
  readonly label: string;
  // What the passage says, out of its quotation.
  readonly body: string;
  // The passage as it stands in the chapter, comment and all.
  readonly whole: string;
  // The line its comment is on.
  readonly line: number;
}

const HOLDS =
  /^<!-- holds from (\d+\.\d+\.\d+\.\d+) up to (\d+\.\d+\.\d+\.\d+) -->\n\n?((?:>.*\n?)+)/gm;

// Every passage of a chapter, in the order it gives them. A malformed one is
// reported to `problems`.
function passagesOf(chapter: string, problems: string[] = []): Passage[] {
  // A code block shows a passage rather than being one, so it is blanked out,
  // keeping its lines so that line numbers hold.
  const text = read(`spec/${chapter}.md`).replace(
    /^```[\s\S]*?^```$/gm,
    (block) => block.replace(/[^\n]/g, " "),
  );
  const out: Passage[] = [];
  let matched = 0;
  for (const m of text.matchAll(HOLDS)) {
    matched += 1;
    const [whole, from = "", until = "", quoted = ""] = m;
    const lines = quoted
      .replace(/\n$/, "")
      .split("\n")
      .map((l) => l.replace(/^> ?/, ""));
    const line = text.slice(0, m.index).split("\n").length;
    const where = `spec/${chapter}.md:${line}`;
    const head = /^\*\*In (.+)\*\*$/.exec(lines[0] ?? "");
    if (head === null || lines[1] !== "") {
      problems.push(
        `${where}: a passage opens with its heading, **In <ranges>**, then a blank line`,
      );
      continue;
    }
    if (compare(from, until) >= 0)
      problems.push(`${where}: a passage holds from a build before ${until}`);
    out.push({
      chapter,
      from,
      until,
      label: head[1] ?? "",
      body: lines.slice(2).join("\n").trim(),
      whole: whole.replace(/\n$/, ""),
      line,
    });
  }
  // A comment that heads no quotation is a passage gone wrong.
  const comments = [...text.matchAll(/^<!-- holds .*-->$/gm)].length;
  if (comments !== matched)
    problems.push(
      `spec/${chapter}.md: a <!-- holds … --> comment is not followed by a quotation, or does not name its builds as "from <build> up to <build>"`,
    );
  return out;
}

// Whether a passage holds for every build of a range.
const holdsFor = (p: Passage, r: Ranged): boolean =>
  compare(r.from, p.from) >= 0 &&
  r.until !== undefined &&
  compare(r.until, p.until) <= 0;

export { chapters, holdsFor, passagesOf };
export type { Passage };
