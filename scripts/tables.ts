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

// The table a season's book carries at the end of a system's chapter: each
// message the season defines, with the command and channel it takes in each
// span of the season's ranges.
function seasonTable(
  system: string,
  season: readonly Ranged[],
  all: readonly Ranged[],
): string {
  // Dashes set each column's share of the width, and the colons align it left.
  const share = [26, 8, 26, 40];
  const rule = share.map((n) => `:${"-".repeat(n)}`).join(" | ");
  const rows = messages
    .filter((m) => m.system === system)
    .flatMap((m) => {
      const here = season.filter((r) => revisionAt(m, r.from) !== undefined);
      if (here.length === 0) return [];
      const groups = new Map<string, Ranged[]>();
      for (const r of here) {
        const v = revisionAt(m, r.from);
        const key = v === undefined ? "" : `${v.command} on ${v.channel}`;
        groups.set(key, [...(groups.get(key) ?? []), r]);
      }
      const whole = here.length === season.length && groups.size === 1;
      const command = [...groups]
        .map(([key, rs]) => (whole ? key : `${key} (${spanName(rs, all)})`))
        .join("; ");
      return [
        `| [\`${m.message}\`](#${anchorOf(m.message)}) | ${by(revisionAt(m, here[0]?.from ?? ""))} | ${command} | ${firstSentence(m.note)} |`,
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
  checked,
  firstSentence,
  messages,
  anchorOf,
  rangeName,
  revisionAt,
  seasonTable,
  spanName,
};
export type { MessageFile };
