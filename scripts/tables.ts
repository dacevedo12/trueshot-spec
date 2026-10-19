// What the generator and the books both write about messages: the tables at
// the end of each system's chapter, and the names of the ranges.
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

// The builds the live checks have results for.
const RESULTS = join(ROOT, "conformance/live/results");
const checked: readonly string[] = existsSync(RESULTS)
  ? readdirSync(RESULTS)
      .filter((f) => f.endsWith(".json"))
      .map(
        (f) => json<{ build: string }>(`conformance/live/results/${f}`).build,
      )
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

// Ranges where each starts as the one before stops read as one span, from the
// first's name to the last's: 4.17, 4.18–4.19 and 4.20 together read 4.17–4.20.
function spans(some: readonly Ranged[], all: readonly Ranged[]): string {
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
      if (first === undefined || last === undefined || first === last)
        return first === undefined ? "" : rangeName(first);
      const end = rangeName(last).split("–");
      return `${twoParts(first.from)}–${end[end.length - 1] ?? ""}`;
    })
    .join(", ");
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

// The table a chapter carries in the repository: which ranges define each
// message, leaving its command and channel to the reference pages.
function chapterTable(
  system: string,
  ranges: readonly Ranged[],
  link: string,
): string {
  const rows = messages
    .filter((m) => m.system === system)
    .map((m) => {
      const where = ranges.filter((r) => revisionAt(m, r.from) !== undefined);
      const span =
        where.length === ranges.length ? "every range" : spans(where, ranges);
      return `| [\`${m.message}\`](${link}${m.file}) | ${by(m.revisions[0])} | ${span} | ${firstSentence(m.note)} |`;
    });
  return [
    "| Message | Sent by | Ranges | What it does |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

// The table a range's book carries: the messages that range defines, with
// the command and channel each takes there.
function rangeTable(system: string, range: Ranged, link: string): string {
  // Dashes set each column's share of the width, and the colons align it left.
  const share = [28, 8, 18, 46];
  const rule = share.map((n) => `:${"-".repeat(n)}`).join(" | ");
  const rows = messages
    .filter((m) => m.system === system)
    .flatMap((m) => {
      const r = revisionAt(m, range.from);
      return r === undefined
        ? []
        : [
            `| [\`${m.message}\`](${link}${m.file}) | ${by(r)} | ${r.command} on ${r.channel} | ${firstSentence(m.note)} |`,
          ];
    });
  return [
    "| Message | Sent by | Command | What it does |",
    `| ${rule} |`,
    ...rows,
  ].join("\n");
}

export {
  by,
  chapterTable,
  firstSentence,
  messages,
  rangeName,
  rangeTable,
  revisionAt,
  spans,
};
export type { MessageFile };
