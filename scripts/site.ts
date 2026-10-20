// The generated site: a home page, and a book for each season, all drawn from
// schema/, spec/ and conformance/. Nothing it writes is committed, so nothing
// it says can drift from what it is drawn from.
//
//   bun scripts/site.ts          write dist/site
//   bun scripts/site.ts --pdf    and each book as a PDF too
//
// This writes dist/site/index.md, the home page, and for each season the parts
// of its book drawn from the definitions, under dist/site/parts/<season>/:
//   about.md     the season's ranges, its builds and its patches
//   messages.md  every message and struct, with each layout it has
//   patches.md   each patch: its checks, and how it differs from the one before
//   index.md     every message by name
// scripts/book.ts then puts each season's book together as dist/site/<season>.md.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { chapters, holdsFor, passagesOf } from "./passages.ts";
import { compare, covers, ranges as coveredRanges } from "./schema.ts";
import type {
  Amount,
  BitRun,
  Channel,
  Field,
  Presence,
  Ranged,
} from "./schema.ts";
import { patchesOf, seasonOf, seasons } from "./seasons.ts";
import {
  anchorOf,
  by,
  firstSentence,
  messages,
  rangeName,
  revisionAt,
  spanName,
} from "./tables.ts";

const ROOT = join(import.meta.dir, "..");
const SITE = join(ROOT, "dist", "site");
const json = <T>(path: string): T =>
  JSON.parse(readFileSync(join(ROOT, path), "utf8")) as T;
const slug = (build: string): string => build.replace(/\./g, "-");

interface Range extends Ranged {
  readonly channels: readonly Channel[];
}
const channelRevisions = json<{
  revisions: (Ranged & { channels: Channel[] })[];
}>("schema/channels.json").revisions;
const ranges: Range[] = coveredRanges().map((r) => ({
  ...r,
  channels: channelRevisions.find((c) => covers(c, r.from))?.channels ?? [],
}));
const systems = json<{ properties: { system: { enum: string[] } } }>(
  "schema/meta/message.json",
).properties.system.enum;
const span = (r: Ranged): string =>
  r.until === undefined
    ? `${r.from} on`
    : `${r.from} up to, not including, ${r.until}`;

// A book is read apart from the repository, so its links into the repository
// go to it on GitHub, and its links within itself to anchors.
const REPOSITORY = "https://github.com/dacevedo12/trueshot-spec";
const repo = `${REPOSITORY}/blob/main/`;
const pages = new Map<string, string>();
const put = (path: string, lines: readonly string[]): void => {
  pages.set(path, `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`);
};
// Two ranges named alike would read as one in a book.
{
  const names = ranges.map((r) => rangeName(r));
  const twice = names.filter((n, i) => names.indexOf(n) !== i);
  if (twice.length > 0)
    throw new Error(
      `ranges are named alike (${[...new Set(twice)].join(", ")}); a checked build must tell them apart`,
    );
}
const rangeAnchor = (r: Ranged): string =>
  `patch-${rangeName(r).replace(/[.–]/g, "-")}`;
const structAnchor = (s: string): string => `struct-${s.toLowerCase()}`;
const cell = (s: string): string =>
  s.replace(/\|/g, "\\|").replace(/\n/g, " ");

// Structs, by name, with the revision that covers a build.
interface StructFile {
  readonly struct: string;
  readonly file: string;
  readonly revisions: readonly (Ranged & {
    readonly fields: readonly Field[];
  })[];
}
const structs: StructFile[] = readdirSync(join(ROOT, "schema/types"))
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((file) => ({
    file,
    ...json<Omit<StructFile, "file">>(`schema/types/${file}`),
  }));
const structAt = (
  s: StructFile,
  build: string,
): readonly Field[] | undefined =>
  s.revisions.find((r) => covers(r, build))?.fields;

// The vectors, by the message or struct they lay out.
interface Vector {
  readonly path: string;
  readonly subject: string;
  readonly message?: string;
  readonly struct?: string;
  readonly version?: string;
}
const vectors: Vector[] = readdirSync(join(ROOT, "conformance/vectors"), {
  recursive: true,
})
  .map(String)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => ({
    path: `conformance/vectors/${f}`,
    ...json<Omit<Vector, "path">>(`conformance/vectors/${f}`),
  }));
const vectorsIn = (r: Ranged): Vector[] =>
  vectors.filter((v) => v.version !== undefined && covers(r, v.version));

// The builds the live checks have run on, each with how its checks fared.
interface Result {
  readonly build: string;
  readonly commit: string;
  readonly date: string;
  readonly checks: readonly { readonly outcome: string }[];
}
const RESULTS = "conformance/live/results";
const results: Result[] = existsSync(join(ROOT, RESULTS))
  ? readdirSync(join(ROOT, RESULTS))
      .filter((f) => f.endsWith(".json"))
      .map((f) => json<Result>(`${RESULTS}/${f}`))
      .sort((a, b) => compare(a.build, b.build))
  : [];

// How the messages page and the changes page name a field's type.
const named = (a: Amount | "remaining" | "terminated"): string =>
  typeof a === "string"
    ? a
    : typeof a === "number"
      ? String(a)
      : "bitsSet" in a
        ? `the bits set in ${a.field}`
        : `${a.field} minus ${a.minus}`;
const typeOf = (f: Field, link: (struct: string) => string): string => {
  switch (f.type) {
    case "string":
      return `text, ${typeof f.size === "number" ? `${f.size} bytes` : f.size === "terminated" ? "ended by a zero byte" : `sized by ${named(f.size)}`}`;
    case "bytes":
      return `bytes, ${typeof f.size === "number" ? f.size : `sized by ${named(f.size)}`}`;
    case "bits":
      return `${f.size}-byte bits`;
    case "bitArray":
      return `bits, ${f.count === "remaining" ? "to the end" : `count in ${named(f.count)}`}`;
    case "array": {
      const count =
        f.size !== undefined
          ? `sized by ${named(f.size)}`
          : f.count === "remaining" || f.count === undefined
            ? "to the end"
            : typeof f.count === "number"
              ? String(f.count)
              : `count in ${named(f.count)}`;
      const item =
        f.items.type === "struct" ? link(f.items.struct) : f.items.type;
      return `${count} × ${item}`;
    }
    case "struct":
      return link(f.struct);
    default:
      return (
        f.type +
        (f.type !== "record" && "endian" in f && f.endian === "big"
          ? ", big-endian"
          : "")
      );
  }
};
const runs = (f: Field): readonly BitRun[] =>
  f.type === "bits" || f.type === "bitArray" ? f.bits : [];
const presence = (p: Presence | undefined): string =>
  p === undefined
    ? ""
    : p.equals !== undefined
      ? `${p.when} = ${([] as number[]).concat(p.equals).join(" or ")}`
      : `${p.when} set`;
const children = (f: Field): readonly Field[] =>
  f.type === "record"
    ? f.fields
    : f.type === "array" && f.items.type === "record"
      ? f.items.fields
      : [];

// 1. Every message and struct of a season, with each layout it has there, and
// the channels and family headers it travels under.
interface FamilyDef {
  readonly name: string;
  readonly header: readonly Field[];
}
const familyRevisions = json<{
  revisions: (Ranged & { families: FamilyDef[] })[];
}>("schema/families.json").revisions;
const noted = (x: unknown): string => {
  const n = (x as { note?: string }).note;
  return n === undefined || n === "" ? "" : n;
};
const structLink = (s: string): string => `[${s}](#${structAnchor(s)})`;
const valuesOf = (f: Field): string =>
  Object.entries(f.values ?? {})
    .map(([k, v]) => `${k} ${v.name}`)
    .join(", ");
const rows = (fields: readonly Field[], depth = 0): string[] =>
  fields.flatMap((f) => {
    const pad = "&nbsp;&nbsp;".repeat(depth);
    const values = valuesOf(f);
    let at = 0;
    return [
      `| ${pad}${f.name} | ${cell(typeOf(f, structLink))} | ${cell(presence(f.present))} | ${cell(noted(f))}${values === "" ? "" : ` Values: ${cell(values)}.`} |`,
      ...runs(f).map((b) => {
        const row = `| ${pad}&nbsp;&nbsp;${b.name} | bit ${at}${b.width === 1 ? "" : ` to ${at + b.width - 1}`} |  | ${cell(noted(b))} |`;
        at += b.width;
        return row;
      }),
      ...rows(children(f), depth + 1),
    ];
  });
const table = (fields: readonly Field[]): string[] =>
  fields.length === 0
    ? ["No body."]
    : [
        "| Field | Type | Present when | What it is |",
        "| --- | --- | --- | --- |",
        ...rows(fields),
      ];
const vectorLinks = (shown: readonly Vector[]): string[] =>
  shown.length === 0
    ? []
    : [
        "",
        `Vectors: ${shown
          .map(
            (v) =>
              `[${v.path
                .split("/")
                .pop()
                ?.replace(/\.json$/, "")}](${repo}${v.path})`,
          )
          .join(", ")}.`,
      ];

// The revisions of a list that cover some of a season's ranges, each with
// those ranges.
function within<T extends Ranged>(
  revisions: readonly T[],
  season: readonly Range[],
): { revision: T; here: Range[] }[] {
  return revisions.flatMap((revision) => {
    const here = season.filter((r) => covers(revision, r.from));
    return here.length === 0 ? [] : [{ revision, here }];
  });
}
// A heading for one layout of several: the ranges it holds for.
const inRanges = (here: readonly Range[], season: readonly Range[]): string =>
  here.length === season.length
    ? "In every range of this book"
    : `In ${spanName(here, ranges)}`;

function messagesPart(season: readonly Range[]): string[] {
  const lines = [
    "# Messages {#appendix-messages}",
    "",
    "Every message a build in this book sends or takes, by system, with each layout it has across the book's ranges and every note its definition carries. A layout is the message's body after the header its channel's family puts in front. A field present when `remaining` is set is present exactly where the payload has bytes left at that point.",
    "",
    "## Channels and families",
  ];
  for (const { revision, here } of within(channelRevisions, season))
    lines.push(
      "",
      `### Channels: ${inRanges(here, season).replace(/^In/, "in")}`,
      "",
      "| Channel | Name | Family |",
      "| --- | --- | --- |",
      ...revision.channels.map((c) => `| ${c.id} | ${c.name} | ${c.family} |`),
    );
  for (const { revision, here } of within(familyRevisions, season))
    lines.push(
      "",
      `### Family headers: ${inRanges(here, season).replace(/^In/, "in")}`,
      ...revision.families.flatMap((f) => [
        "",
        `The ${f.name} family:`,
        "",
        ...table(f.header),
      ]),
    );
  const held = new Set<string>();
  const hold = (fields: readonly Field[]): void => {
    for (const f of fields) {
      const name =
        f.type === "struct"
          ? f.struct
          : f.type === "array" && f.items.type === "struct"
            ? f.items.struct
            : undefined;
      if (name !== undefined && !held.has(name)) {
        held.add(name);
        const s = structs.find((x) => x.struct === name);
        for (const r of s?.revisions ?? []) hold(r.fields);
      }
      hold(children(f));
      if (f.type === "array") hold([f.items]);
    }
  };
  for (const system of systems) {
    const here = messages.filter(
      (m) => within(m.revisions, season).length > 0,
    );
    const own = here.filter((m) => m.system === system);
    if (own.length === 0) continue;
    lines.push(
      "",
      `## ${system.charAt(0).toUpperCase() + system.slice(1)}`,
      "",
      `How these work together is in the [${system}](#chapter-${system}) chapter.`,
    );
    for (const m of own) {
      const layouts = within(m.revisions, season);
      lines.push(
        "",
        `### \`${m.message}\` {#${anchorOf(m.message)}}`,
        ...[noted(m)].filter((n) => n !== "").flatMap((n) => ["", n]),
        "",
        `[Definition](${repo}schema/messages/${m.file}).`,
      );
      for (const { revision: r, here: rs } of layouts) {
        hold(r.fields);
        lines.push(
          "",
          `#### ${inRanges(rs, season)}`,
          "",
          `Command ${r.command} on ${r.channel}${(r.alsoOn ?? []).map((o) => `, or on ${o.channel} ${o.reliability}`).join("")}, ${by(r) === "both" ? "sent by either side" : `sent by the ${by(r)}`}, ${r.reliability}. This layout holds from ${r.from} up to ${r.until ?? "the end"}.`,
          ...[noted(r)].filter((n) => n !== "").flatMap((n) => ["", n]),
          "",
          ...table(r.fields),
          ...vectorLinks(
            vectors.filter(
              (v) =>
                v.message === m.message &&
                v.version !== undefined &&
                covers(r, v.version),
            ),
          ),
        );
      }
    }
  }
  const order = [...held].sort();
  if (order.length > 0)
    lines.push(
      "",
      "# Structs {#appendix-structs}",
      "",
      "The groups of fields the messages above hold, each with the layout it has across the book's ranges.",
    );
  for (const name of order) {
    const s = structs.find((x) => x.struct === name);
    if (s === undefined) continue;
    const layouts = within(s.revisions, season);
    if (layouts.length === 0) continue;
    lines.push(
      "",
      `## \`${name}\` {#${structAnchor(name)}}`,
      ...[noted(s)].filter((n) => n !== "").flatMap((n) => ["", n]),
      "",
      `[Definition](${repo}schema/types/${s.file}).`,
    );
    for (const { revision, here } of layouts)
      lines.push(
        "",
        `### ${inRanges(here, season)}`,
        "",
        ...table(revision.fields),
        ...vectorLinks(
          vectors.filter(
            (v) =>
              v.struct === name &&
              v.version !== undefined &&
              covers(revision, v.version),
          ),
        ),
      );
  }
  return lines;
}

// 2. What differs between two ranges.
//
// Fields are compared by where they sit: the path of names that leads to each.
// A field whose name changes reads as one removed and one added.
interface Flat {
  readonly path: string;
  readonly type: string;
  readonly present: string;
  readonly values: string;
  readonly bits: readonly { name: string; at: number; width: number }[];
}
function flatten(fields: readonly Field[], prefix = ""): Flat[] {
  return fields.flatMap((f) => {
    const path = `${prefix}${f.name}`;
    let at = 0;
    const own: Flat = {
      path,
      type: typeOf(f, (s) => s),
      present: presence(f.present),
      values: Object.entries(f.values ?? {})
        .map(([k, v]) => `${k} ${v.name}`)
        .join(", "),
      bits: runs(f).map((b) => {
        const placed = { name: b.name, at, width: b.width };
        at += b.width;
        return placed;
      }),
    };
    const inner = children(f);
    return [
      own,
      ...flatten(inner, f.type === "array" ? `${path}[].` : `${path}.`),
    ];
  });
}
const withoutNotes = (v: unknown): unknown =>
  JSON.parse(
    JSON.stringify(v, (k, x: unknown) => (k === "note" ? undefined : x)),
  );
const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

// The differences between two field lists, one line each.
// P names the earlier range and C the later.
function fieldChanges(
  before: readonly Field[],
  after: readonly Field[],
  P: string,
  C: string,
): string[] {
  const a = flatten(before);
  const b = flatten(after);
  const old = new Map(a.map((f) => [f.path, f]));
  const now = new Map(b.map((f) => [f.path, f]));
  const out: string[] = [];
  for (const f of b) {
    const was = old.get(f.path);
    if (was === undefined) {
      const after = b[b.indexOf(f) - 1];
      out.push(
        `\`${f.path}\` is in ${C} (${f.type})${after === undefined ? " at the start" : `, after \`${after.path}\``}, and not in ${P}.`,
      );
      continue;
    }
    if (was.type !== f.type)
      out.push(`\`${f.path}\` is ${was.type} in ${P} and ${f.type} in ${C}.`);
    if (was.present !== f.present)
      out.push(
        `\`${f.path}\` is ${was.present === "" ? "always present" : `present when ${was.present}`} in ${P}, and ${f.present === "" ? "always present" : `present when ${f.present}`} in ${C}.`,
      );
    if (was.values !== f.values) {
      const list = (v: string): string[] => (v === "" ? [] : v.split(", "));
      const gone = list(was.values).filter((v) => !list(f.values).includes(v));
      const come = list(f.values).filter((v) => !list(was.values).includes(v));
      if (come.length > 0)
        out.push(
          `\`${f.path}\` takes ${come.join(", ")} in ${C} and not in ${P}.`,
        );
      if (gone.length > 0)
        out.push(
          `\`${f.path}\` takes ${gone.join(", ")} in ${P} and not in ${C}.`,
        );
    }
    const bitsWere = new Map(was.bits.map((x) => [x.name, x]));
    const bitsNow = new Map(f.bits.map((x) => [x.name, x]));
    // A bit that keeps its place under another name is renamed, not moved.
    const renamed = new Set<string>();
    for (const x of f.bits) {
      const y = was.bits.find(
        (b) => b.at === x.at && b.width === x.width && !bitsNow.has(b.name),
      );
      if (!bitsWere.has(x.name) && y !== undefined) {
        out.push(
          `\`${f.path}\` names bit ${x.at} \`${y.name}\` in ${P} and \`${x.name}\` in ${C}.`,
        );
        renamed.add(x.name).add(y.name);
      }
    }
    for (const x of f.bits) {
      if (renamed.has(x.name)) continue;
      const y = bitsWere.get(x.name);
      if (y === undefined)
        out.push(
          `\`${f.path}\` has \`${x.name}\` at bit ${x.at} in ${C}, and not in ${P}.`,
        );
      else if (y.at !== x.at || y.width !== x.width)
        out.push(
          `\`${f.path}.${x.name}\` is at bit ${y.at}${y.width === x.width ? "" : `, ${y.width} bits wide,`} in ${P} and at bit ${x.at}${y.width === x.width ? "" : `, ${x.width} bits wide,`} in ${C}.`,
        );
    }
    for (const y of was.bits)
      if (!bitsNow.has(y.name) && !renamed.has(y.name))
        out.push(
          `\`${f.path}\` has \`${y.name}\` at bit ${y.at} in ${P}, and not in ${C}.`,
        );
  }
  for (const f of a)
    if (!now.has(f.path))
      out.push(`\`${f.path}\` is in ${P} and not in ${C}.`);
  const kept = (list: Flat[], other: Map<string, Flat>): string[] =>
    list.filter((f) => other.has(f.path)).map((f) => f.path);
  if (out.length === 0 && !same(kept(a, now), kept(b, old)))
    out.push(`The same fields come in another order in ${C}.`);
  return out;
}

interface Changed {
  readonly name: string;
  readonly lines: readonly string[];
}

// Whether a range lacks a message that the nearest ranges on both sides of
// the run of ranges lacking it define: a gap in what is recorded.
const gapAt = (m: (typeof messages)[number], i: number): boolean => {
  const has = (k: number): boolean => {
    const r = ranges[k];
    return r !== undefined && revisionAt(m, r.from) !== undefined;
  };
  if (i < 0 || i >= ranges.length || has(i)) return false;
  let before = i - 1;
  while (before >= 0 && !has(before)) before -= 1;
  let after = i + 1;
  while (after < ranges.length && !has(after)) after += 1;
  return before >= 0 && after < ranges.length;
};

function changesPart(prev: Range, range: Range): string[] {
  const i = ranges.indexOf(range);
  const P = rangeName(prev);
  const C = rangeName(range);
  const lines = [
    `### Against ${P}`,
    "",
    `Where a build from ${span(range)} differs from one from ${span(prev)}. Anything not named here is the same in both.`,
  ];
  const section = (title: string, body: readonly string[]): void => {
    if (body.length > 0) lines.push("", `#### ${title}`, "", ...body);
  };

  // The header, the channels and the families.
  const header: string[] = [];
  for (const [file, what] of [
    ["schema/protocol.json", "packet header"],
    ["schema/families.json", "families"],
  ] as const) {
    const revs = json<{ revisions: Ranged[] }>(file).revisions;
    const a = revs.find((r) => covers(r, prev.from));
    const b = revs.find((r) => covers(r, range.from));
    if (a !== b)
      header.push(
        `- The ${what} differ: see [${file.split("/")[1]}](${repo}${file}).`,
      );
  }
  const ids = (cs: readonly Channel[]): Map<string, Channel> =>
    new Map(cs.map((c) => [c.name, c]));
  const was = ids(prev.channels);
  const now = ids(range.channels);
  for (const c of range.channels) {
    const w = was.get(c.name);
    if (w === undefined)
      header.push(
        `- Channel ${c.id}, ${c.name}, in the ${c.family} family, is in ${C} and not in ${P}.`,
      );
    else if (w.id !== c.id || w.family !== c.family)
      header.push(
        `- Channel ${c.name} is ${w.id} in the ${w.family} family in ${P}, and ${c.id} in the ${c.family} family in ${C}.`,
      );
  }
  for (const c of prev.channels)
    if (!now.has(c.name))
      header.push(`- Channel ${c.id}, ${c.name}, is in ${P} and not in ${C}.`);
  section("Transport", header);

  // The messages.
  const added: string[] = [];
  const removed: string[] = [];
  const changed: Changed[] = [];
  const notesOnly: string[] = [];
  const unrecorded: string[] = [];
  const again: string[] = [];
  const renumbered: string[] = [];
  // A message this book holds links to its section; one only another
  // season's book holds, to its definition.
  const inBook = new Set(
    messages
      .filter((m) => within(m.revisions, seasonRanges(range)).length > 0)
      .map((m) => m.file),
  );
  const def = (file: string, name: string): string =>
    inBook.has(file)
      ? `[\`${name}\`](#${anchorOf(name)})`
      : `[\`${name}\`](${repo}schema/messages/${file})`;
  for (const m of messages) {
    let a = revisionAt(m, prev.from);
    const b = revisionAt(m, range.from);
    if (a === b) continue;
    // A message the range before did not record is measured from the
    // nearest range before that does.
    if (a === undefined && b !== undefined && gapAt(m, i - 1)) {
      again.push(def(m.file, m.message));
      for (let k = i - 2; k >= 0 && a === undefined; k -= 1)
        a = revisionAt(m, ranges[k]?.from ?? "");
      if (a === b) continue;
    }
    if (b === undefined && a !== undefined && gapAt(m, i)) {
      unrecorded.push(def(m.file, m.message));
      continue;
    }
    if (a === undefined && b !== undefined) {
      added.push(
        `| ${def(m.file, m.message)} | ${by(b)} | ${b.command} on ${b.channel} | ${cell(firstSentence(m.note))} |`,
      );
      continue;
    }
    if (b === undefined && a !== undefined) {
      removed.push(
        `| ${def(m.file, m.message)} | ${by(a)} | ${a.command} on ${a.channel} |`,
      );
      continue;
    }
    if (a === undefined || b === undefined) continue;
    const strip = (r: typeof a): unknown =>
      withoutNotes({ ...r, from: undefined, until: undefined });
    if (same(strip(a), strip(b))) {
      if (!same({ ...a, from: 0, until: 0 }, { ...b, from: 0, until: 0 }))
        notesOnly.push(def(m.file, m.message));
      continue;
    }
    if (
      a.command !== b.command &&
      same(strip(a), strip({ ...b, command: a.command }))
    ) {
      renumbered.push(
        `| ${def(m.file, m.message)} | ${b.channel} | ${a.command} | ${b.command} |`,
      );
      continue;
    }
    const out: string[] = [];
    if (a.command !== b.command)
      out.push(
        `Its command is ${a.command} in ${P} and ${b.command} in ${C}.`,
      );
    if (a.channel !== b.channel)
      out.push(`It travels on ${a.channel} in ${P} and ${b.channel} in ${C}.`);
    if (a.direction !== b.direction)
      out.push(`The ${by(a)} sends it in ${P}, and the ${by(b)} in ${C}.`);
    if (a.reliability !== b.reliability)
      out.push(
        `It is sent ${a.reliability} in ${P} and ${b.reliability} in ${C}.`,
      );
    if (!same(a.alsoOn ?? [], b.alsoOn ?? []))
      out.push("The other channels it may come on change.");
    out.push(...fieldChanges(a.fields, b.fields, P, C));
    if (out.length === 0) out.push("Its layout changes in a detail.");
    const backing = vectorsIn(range).filter((v) => v.message === m.message);
    changed.push({
      name: `${def(m.file, m.message)}${
        backing.length === 0
          ? ""
          : ` (vectors: ${backing
              .map(
                (v) =>
                  `[${v.path
                    .split("/")
                    .pop()
                    ?.replace(/\.json$/, "")}](${repo}${v.path})`,
              )
              .join(", ")})`
      }`,
      lines: out,
    });
  }
  section(
    `In ${C}, not in ${P}`,
    added.length === 0
      ? []
      : [
          "| Message | Sent by | Command | What it does |",
          "| --- | --- | --- | --- |",
          ...added,
        ],
  );
  section(
    `In ${P}, not in ${C}`,
    removed.length === 0
      ? []
      : [
          "| Message | Sent by | Command it had |",
          "| --- | --- | --- |",
          ...removed,
        ],
  );
  section(
    "Not recorded",
    unrecorded.length === 0
      ? []
      : [
          `The nearest ranges on either side of ${C} that define these both do, and ${C} does not: the specification says nothing of whether a build in it sends or takes them, rather than that it does not. ${unrecorded.join(", ")}.`,
        ],
  );
  section(
    "Recorded again",
    again.length === 0
      ? []
      : [
          `${P} does not record these, and the nearest ranges on either side of it that define them both do: ${again.join(", ")}. Where they differ from the nearest range before that does, they are under the layouts that differ.`,
        ],
  );
  section(
    "Commands",
    renumbered.length === 0
      ? []
      : [
          "These differ only in their command:",
          "",
          `| Message | Channel | ${P} | ${C} |`,
          "| --- | --- | --- | --- |",
          ...renumbered,
        ],
  );
  section(
    "Laid out differently",
    changed.flatMap((c) => [`- ${c.name}`, ...c.lines.map((l) => `  - ${l}`)]),
  );

  // Structs that change between the two.
  const structLines: string[] = [];
  for (const s of structs) {
    const a = structAt(s, prev.from);
    const b = structAt(s, range.from);
    if (a === b) continue;
    const name = `[\`${s.struct}\`](${repo}schema/types/${s.file})`;
    if (a === undefined)
      structLines.push(`- ${name} is in ${C} and not in ${P}.`);
    else if (b === undefined)
      structLines.push(`- ${name} is in ${P} and not in ${C}.`);
    else if (!same(withoutNotes(a), withoutNotes(b)))
      structLines.push(
        `- ${name}`,
        ...fieldChanges(a, b, P, C).map((l) => `  - ${l}`),
      );
  }
  section("Structs", structLines);

  // The passages of the chapters that hold for one of the two and not the
  // other, each named by how it opens.
  const passageLines: string[] = [];
  for (const chapter of chapters)
    for (const p of passagesOf(chapter)) {
      const was = holdsFor(p, prev);
      const is = holdsFor(p, range);
      if (was === is) continue;
      const opening = cell(
        (p.body.split(/(?<=\.)\s/)[0] ?? "").replace(/\s+/g, " "),
      );
      passageLines.push(
        `- In the [${chapter}](#chapter-${chapter}) chapter, a passage holds for ${is ? C : P} and not ${is ? P : C}: ${opening}`,
      );
    }
  section("Chapters", passageLines);

  section(
    "Only notes",
    notesOnly.length === 0
      ? []
      : [
          "These read the same on the wire, and only their notes change:",
          "",
          notesOnly.join(", "),
        ],
  );
  if (lines.length === 3) lines.push("", "Nothing differs on the wire.");
  return lines;
}

// 3. Each range of a season: its builds, its checks, what the specification
// leaves unrecorded there, and how it differs from the range before it.
const seasonRanges = (r: Ranged): Range[] =>
  ranges.filter((x) => seasonOf(x) === seasonOf(r));

function patchesPart(season: readonly Range[]): string[] {
  const lines = [
    "# Patches {#appendix-patches}",
    "",
    "What is particular to each patch this book covers: the builds it shipped, the live checks that ran on them, what the specification leaves unrecorded there, and how it differs from the patch before it. Where builds of two patches are held to the same facts, they share a section.",
  ];
  for (const range of season) {
    const i = ranges.indexOf(range);
    const prev = ranges[i - 1];
    const ran = results.filter((r) => covers(range, r.build));
    const lacks = messages.filter((m) => gapAt(m, i));
    // What the chapters say to this range: each without the passages that
    // hold for other ranges.
    const told = chapters
      .map((c) =>
        passagesOf(c)
          .filter((p) => !holdsFor(p, range))
          .reduce(
            (text, p) => text.replace(p.whole, ""),
            readFileSync(join(ROOT, "spec", `${c}.md`), "utf8"),
          ),
      )
      .join("\n");
    const named = new Set(
      [...told.matchAll(/`([A-Z][A-Za-z0-9]*)`/g)].map((m) => m[1]),
    );
    const absent = messages.filter(
      (m) => named.has(m.message) && revisionAt(m, range.from) === undefined,
    );
    const list = (ms: readonly (typeof messages)[number][]): string =>
      ms
        .map((m) =>
          within(m.revisions, season).length > 0
            ? `[\`${m.message}\`](#${anchorOf(m.message)})`
            : `[\`${m.message}\`](${repo}schema/messages/${m.file})`,
        )
        .join(", ");
    lines.push(
      "",
      `## ${rangeName(range)} {#${rangeAnchor(range)}}`,
      "",
      `Client builds from ${span(range)}. Patch notes: ${patchesOf(range)
        .map((p) => `[V${p.name}](${p.url})`)
        .join(", ")}.`,
      "",
      ...(ran.length === 0
        ? ["No build in this range has been checked against a live client."]
        : [
            "| Build checked | Passed | Failed | Skipped | Commit | Date |",
            "| --- | --- | --- | --- | --- | --- |",
            ...ran.map((r) => {
              const n = (o: string): number =>
                r.checks.filter((c) => c.outcome === o).length;
              return `| [${r.build}](${repo}${RESULTS}/${slug(r.build)}.json) | ${n("passed")} | ${n("failed")} | ${n("skipped")} | ${r.commit.slice(0, 7)} | ${r.date} |`;
            }),
          ]),
    );
    if (lacks.length > 0)
      lines.push(
        "",
        `The nearest ranges on either side of this one that define these both do, and this one does not; the specification says nothing of whether a build in it sends or takes them: ${list(lacks)}.`,
      );
    if (absent.length > 0)
      lines.push(
        "",
        `The chapters name these, and no build in this range sends or takes them, so what they say of them says nothing of this range: ${list(absent)}.`,
      );
    // A range is set against the one before it in the same book; the first of
    // a season stands on its own, since the season before has a book of its
    // own.
    if (prev !== undefined && seasonOf(prev) === seasonOf(range))
      lines.push("", ...changesPart(prev, range));
  }
  return lines;
}

// 4. Every message of a season by name, and the season's ranges for the book's
// opening.
function indexPart(season: readonly Range[]): string[] {
  const own = messages
    .filter((m) => within(m.revisions, season).length > 0)
    .sort((a, b) => a.message.localeCompare(b.message));
  return [
    "# Index of messages {#appendix-index}",
    "",
    "| Message | System | Ranges |",
    "| --- | --- | --- |",
    ...own.map(
      (m) =>
        `| [\`${m.message}\`](#${anchorOf(m.message)}) | ${m.system} | ${spanName(
          season.filter((r) => revisionAt(m, r.from) !== undefined),
          ranges,
        )} |`,
    ),
  ];
}
const patchRows = (season: readonly Range[]): string[] => [
  "| Patch | From | Up to | Patch notes | Builds checked |",
  "| --- | --- | --- | --- | --- |",
  ...season.map(
    (r) =>
      `| [${rangeName(r)}](#${rangeAnchor(r)}) | ${r.from} | ${r.until ?? "on"} | ${patchesOf(
        r,
      )
        .map((p) => `[V${p.name}](${p.url})`)
        .join(", ")} | ${results.filter((x) => covers(r, x.build)).length} |`,
  ),
];
function aboutPart(season: readonly Range[]): string[] {
  const first = season[0];
  const last = season[season.length - 1];
  return [
    `This book covers client builds from ${first?.from ?? ""} up to, not including, ${last?.until ?? "the end"}, in ${season.length === 1 ? "one range" : `${season.length} ranges`}. Every build in a range is held to the same facts.`,
    "",
    ...patchRows(season),
    "",
    "Everything in the chapters holds for every range of the book, except a passage set apart and headed with ranges, which holds for those alone. What the chapters say of a message says nothing of a range that has no layout for it; [the appendix on messages](#appendix-messages) gives each message's layouts by range, and [the appendix on patches](#appendix-patches) each patch's checks and how it differs from the one before it.",
  ];
}

const held = seasons.filter((s) => ranges.some((r) => seasonOf(r) === s));
for (const s of held) {
  const own = ranges.filter((r) => seasonOf(r) === s);
  put(`parts/${s.folder}/about.md`, aboutPart(own));
  put(`parts/${s.folder}/messages.md`, messagesPart(own));
  put(`parts/${s.folder}/patches.md`, patchesPart(own));
  put(`parts/${s.folder}/index.md`, indexPart(own));
}
put("index.md", [
  "# Trueshot",
  "",
  "A wire protocol specification for League of Legends game servers, with one book for each season it covers.",
  "",
  ...held.map((s) => `- [${s.name}](${s.folder}.md)`),
]);

rmSync(SITE, { recursive: true, force: true });
for (const [path, text] of pages) {
  const full = join(SITE, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
}
// The books go beside the home page, so a site is never left without them.
const books = Bun.spawnSync(
  ["bun", join(ROOT, "scripts/book.ts"), ...process.argv.slice(2)],
  { stdout: "inherit", stderr: "inherit" },
);
if (books.exitCode !== 0) process.exit(books.exitCode);
console.log(
  `wrote the home page and ${held.length} books, over ${ranges.length} ranges, to dist/site`,
);
