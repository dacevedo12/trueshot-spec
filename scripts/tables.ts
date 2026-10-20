// What the site and the books both write about messages: the table at the
// end of each system's chapter in a book, and the names of the ranges.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compare, covers } from "./schema.ts";
import type { Ranged, Revision } from "./schema.ts";

interface MessageFile {
  readonly file: string;
  readonly message: string;
  readonly system: string;
  readonly note?: string;
  readonly revisions: readonly Revision[];
}

const ROOT = join(import.meta.dir, "..");
const json = <T>(path: string): T =>
  JSON.parse(readFileSync(join(ROOT, path), "utf8")) as T;

const messages: readonly MessageFile[] = readdirSync(
  join(ROOT, "schema/messages"),
)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((file) => ({
    file,
    ...json<Omit<MessageFile, "file">>(`schema/messages/${file}`),
  }));

// The builds the live checks bear out: those with a results file where no
// check failed. A range claims these as well as its first build.
const RESULTS = join(ROOT, "conformance/live/results");
const checked: readonly string[] = existsSync(RESULTS)
  ? readdirSync(RESULTS)
      .filter((f) => f.endsWith(".json"))
      .map((f) =>
        json<{ build: string; checks: { outcome: string }[] }>(
          `conformance/live/results/${f}`,
        ),
      )
      .filter((r) => r.checks.every((c) => c.outcome !== "failed"))
      .map((r) => r.build)
  : [];

const twoParts = (build: string): string =>
  build.split(".").slice(0, 2).join(".");

// A range is named for its first build's first two parts, and, where the
// builds checked within it reach a later pair, that pair after a dash:
// 4.18–4.19 for the range from 4.18.0.271 whose last checked build is a 4.19.
function rangeName(r: Ranged): string {
  const inside = checked.filter((b) => covers(r, b)).sort(compare);
  const last = inside[inside.length - 1];
  const first = twoParts(r.from);
  return last === undefined || twoParts(last) === first
    ? first
    : `${first}–${twoParts(last)}`;
}

const revisionAt = (m: MessageFile, build: string): Revision | undefined =>
  m.revisions.find((r) => covers(r, build));

// A note's first sentence; "What a server sends to do something" becomes
// "Do something", and any other opening is kept whole.
const firstSentence = (note = ""): string => {
  const end = note.search(/\.(\s|$)/);
  const t = end >= 0 ? note.slice(0, end) : note;
  const m = /^What (?:a|the) (?:server|client) sends to (.*)$/.exec(t);
  const rest = m?.[1];
  return rest === undefined ? t : rest.charAt(0).toUpperCase() + rest.slice(1);
};
const by = (r: Revision | undefined): string =>
  r?.direction === "clientToServer"
    ? "client"
    : r?.direction === "bidirectional"
      ? "both"
      : "server";

// Ranges named together: a run of ranges that follow one another reads as
// one span, from the first's name to the last's, so 4.17, 4.18–4.19 and 4.20
// read 4.17–4.20, and runs apart are listed apart.
function spanName(some: readonly Ranged[], all: readonly Ranged[]): string {
  const runs: Ranged[][] = [];
  for (const r of some) {
    const run = runs[runs.length - 1];
    const prev = run?.[run.length - 1];
    if (
      run !== undefined &&
      prev !== undefined &&
      all.indexOf(prev) + 1 === all.indexOf(r) &&
      prev.until === r.from
    )
      run.push(r);
    else runs.push([r]);
  }
  return runs
    .map((run) => {
      const first = run[0];
      const last = run[run.length - 1];
      if (first === undefined || last === undefined) return "";
      if (first === last) return rangeName(first);
      const end = rangeName(last).split("–");
      return `${twoParts(first.from)}–${end[end.length - 1] ?? ""}`;
    })
    .join(", ");
}

// A message's anchor in a book.
const anchorOf = (message: string): string =>
  `message-${message.toLowerCase()}`;

export {
  by,
  checked,
  firstSentence,
  messages,
  anchorOf,
  rangeName,
  revisionAt,
  spanName,
};
export type { MessageFile };
