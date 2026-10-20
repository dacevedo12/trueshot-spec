// The generated site: one folder per season, and in it one per range of
// versions, all drawn from schema/, spec/ and conformance/. Nothing it writes
// is committed, so nothing it says can drift from what it is drawn from.
//
//   bun scripts/site.ts          write dist/site, with every range's book
//   bun scripts/site.ts --pdf    and each book as a PDF too
//
// For every range, dist/site/<season>/<range>/ holds:
//   README.md   what the range is: its builds, patches, checks and bindings
//   changes.md  what differs from the range before it
//   messages.md every message, by system, with the layout of its body
// and scripts/book.ts adds the range's book beside them.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  bindingsFor,
  chapters,
  filled,
  placesOf,
  sections,
} from "./bindings.ts";
import type { Binding } from "./bindings.ts";
import { compare, covers, ranges as coveredRanges } from "./schema.ts";
import type {
  Amount,
  BitRun,
  Channel,
  Field,
  Presence,
  Ranged,
} from "./schema.ts";
import { folderOf, patchesOf, seasonOf, seasons } from "./seasons.ts";
import {
  by,
  firstSentence,
  messages,
  rangeName,
  revisionAt,
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

// Every page is written from its own folder, so a link into the repository
// climbs out of dist/site first.
const pages = new Map<string, string>();
const put = (path: string, lines: readonly string[]): void => {
  if (pages.has(path))
    throw new Error(
      `two ranges are named alike and would both write ${path}; name one by its build`,
    );
  pages.set(path, `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`);
};
const up = (path: string): string => "../".repeat(path.split("/").length + 1);
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

// 1. Every message of a range, by system, with every note its definition
// carries, the headers its families put in front, the structs it holds and
// the vectors that show it.
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
function messagesPage(range: Range, path: string): string[] {
  const repo = up(path);
  const link = (s: string): string => `[${s}](#struct-${s.toLowerCase()})`;
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
        `| ${pad}${f.name} | ${cell(typeOf(f, link))} | ${cell(presence(f.present))} | ${cell(noted(f))}${values === "" ? "" : ` Values: ${cell(values)}.`} |`,
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
  const families =
    familyRevisions.find((r) => covers(r, range.from))?.families ?? [];
  const lines = [
    `# Messages of ${rangeName(range)}`,
    "",
    `Every message a build from ${span(range)} sends or takes, by system, with every note its definition carries and the layout of its body after the header its channel's family puts in front. How a system's messages work together is in the system's chapter. A field present when \`remaining\` is set is present exactly where the payload has bytes left at that point.`,
    "",
    "## Channels",
    "",
    "| Channel | Name | Family |",
    "| --- | --- | --- |",
    ...range.channels.map((c) => `| ${c.id} | ${c.name} | ${c.family} |`),
    "",
    "## Families",
    "",
    "The header each family puts in front of every message on its channels.",
    ...families.flatMap((f) => [
      "",
      `### The ${f.name} family`,
      "",
      ...table(f.header),
    ]),
  ];
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
        if (s !== undefined) hold(structAt(s, range.from) ?? []);
      }
      hold(children(f));
      if (f.type === "array") hold([f.items]);
    }
  };
  for (const s of systems) {
    const here = messages.filter(
      (m) => m.system === s && revisionAt(m, range.from) !== undefined,
    );
    if (here.length === 0) continue;
    lines.push(
      "",
      `## ${s.charAt(0).toUpperCase() + s.slice(1)}`,
      "",
      `See the [${s}](${repo}spec/${s}.md) chapter.`,
    );
    for (const m of here) {
      const r = revisionAt(m, range.from);
      if (r === undefined) continue;
      hold(r.fields);
      const shown = vectors.filter(
        (v) =>
          v.message === m.message &&
          v.version !== undefined &&
          covers(r, v.version),
      );
      lines.push(
        "",
        `### ${m.message}`,
        "",
        `Command ${r.command} on ${r.channel}${(r.alsoOn ?? []).map((o) => `, or on ${o.channel} ${o.reliability}`).join("")}, ${by(r) === "both" ? "sent by either side" : `sent by the ${by(r)}`}, ${r.reliability}. The layout holds from ${r.from} up to ${r.until ?? "the end"}. [Definition](${repo}schema/messages/${m.file}).`,
        ...[noted(m), noted(r)]
          .filter((n) => n !== "")
          .flatMap((n) => ["", n]),
        "",
        ...table(r.fields),
        ...(shown.length === 0
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
            ]),
      );
    }
  }
  const order = [...held].sort();
  if (order.length > 0) lines.push("", "## Structs");
  for (const name of order) {
    const s = structs.find((x) => x.struct === name);
    const fields = s === undefined ? undefined : structAt(s, range.from);
    if (s === undefined || fields === undefined) continue;
    lines.push(
      "",
      `### Struct ${name}`,
      "",
      `[Definition](${repo}schema/types/${s.file}).`,
      ...[noted(s)].filter((n) => n !== "").flatMap((n) => ["", n]),
      "",
      ...table(fields),
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

function changesPage(prev: Range, range: Range, path: string): string[] {
  const i = ranges.indexOf(range);
  const P = rangeName(prev);
  const C = rangeName(range);
  const repo = up(path);
  const lines = [
    `# ${C} against ${P}`,
    "",
    `Where a build from ${span(range)} differs from one from ${span(prev)}. Anything not named here is the same in both. The [messages](messages.md) page and the [book](book.md) give the whole of ${C}.`,
  ];
  const section = (title: string, body: readonly string[]): void => {
    if (body.length > 0) lines.push("", `## ${title}`, "", ...body);
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
  const def = (file: string, name: string): string =>
    `[\`${name}\`](${repo}schema/messages/${file})`;
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

  // What the bindings set in place, chapter by chapter.
  const before = filled(prev);
  const after = filled(range);
  const entry = (
    chapter: string,
    key: string,
    from: readonly Binding[],
  ): string =>
    from
      .map((b) => sections(`${b.dir}/${chapter}.md`).get(key) ?? "")
      .join("\n\n");
  const bindingLines: string[] = [];
  for (const chapter of chapters) {
    const a = before.get(chapter) ?? new Map<string, Binding[]>();
    const b = after.get(chapter) ?? new Map<string, Binding[]>();
    const keys = [...new Set([...a.keys(), ...b.keys()])];
    for (const key of keys) {
      const x = a.get(key);
      const y = b.get(key);
      const where = (bs: readonly Binding[]): string =>
        bs
          .map(
            (bb) =>
              `[${bb.dir.split("/").pop()}](${repo}${bb.dir}/${chapter}.md)`,
          )
          .join(", ");
      const place = `the ${chapter} chapter's \`${key}\``;
      if (x === undefined && y !== undefined)
        bindingLines.push(
          `- ${C} fills ${place}, from ${where(y)}, and ${P} does not.`,
        );
      else if (y === undefined && x !== undefined)
        bindingLines.push(
          `- ${P} fills ${place}, from ${where(x)}, and ${C} does not.`,
        );
      else if (
        x !== undefined &&
        y !== undefined &&
        entry(chapter, key, x) !== entry(chapter, key, y)
      )
        bindingLines.push(
          `- ${place} says one thing in ${P}, from ${where(x)}, and another in ${C}, from ${where(y)}.`,
        );
    }
  }
  section("Chapters", bindingLines);

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

// 3. A range's own page.
function rangePage(i: number, path: string): string[] {
  const range = ranges[i];
  if (range === undefined) return [];
  const prev = ranges[i - 1];
  const repo = up(path);
  const season = seasonOf(range);
  const ran = results.filter((r) => covers(range, r.build));
  const here = messages.filter((m) => revisionAt(m, range.from) !== undefined);
  const count = (d: string): number =>
    here.filter((m) => by(revisionAt(m, range.from)) === d).length;
  // What both neighbours define and this range does not: a gap, or a message
  // these builds alone go without.
  const lacks = messages.filter((m) => gapAt(m, i));
  const lines = [
    `# ${rangeName(range)}`,
    "",
    `Client builds from ${span(range)}, in [${season.name}](../README.md). Patch notes: ${patchesOf(
      range,
    )
      .map((p) => `[V${p.name}](${p.url})`)
      .join(", ")}.`,
    "",
    "- [The book](book.md), the chapters with this range's bindings in place, as one document. A PDF is beside it when the site is built with `--pdf`.",
    `- [Every message](messages.md): ${here.length} messages, ${count("server")} sent by the server, ${count("client")} by the client and ${count("both")} by either.`,
    ...(prev === undefined
      ? []
      : [`- [How it differs from ${rangeName(prev)}](changes.md).`]),
    "",
    "## Bindings",
    "",
    ...(bindingsFor(range).length === 0
      ? ["No binding adds to the chapters for this range."]
      : [
          "What this range alone does, set in place in its book:",
          "",
          ...bindingsFor(range).map(
            (b) =>
              `- [${b.dir.split("/").pop()}](${repo}${b.dir}/), for ${b.until === undefined ? "this range alone" : `every range from ${b.from} up to ${b.until}`}: ${readdirSync(
                join(ROOT, b.dir),
              )
                .map((f) => f.replace(/\.md$/, ""))
                .join(", ")}.`,
          ),
        ]),
    "",
    "## Places",
    "",
    "Each place a chapter marks for its bindings, with the bindings that fill it for this range. Where none does, the chapter's own text is all the specification says there for this range, which is not a finding that the range does nothing more.",
    "",
    "| Chapter | Place | Filled by |",
    "| --- | --- | --- |",
    ...chapters.flatMap((chapter) => {
      const own = filled(range).get(chapter);
      return placesOf(chapter).map((key) => {
        const by = own?.get(key) ?? [];
        return `| [${chapter}](${repo}spec/${chapter}.md) | ${key} | ${by.length === 0 ? "" : by.map((b) => `[${b.dir.split("/").pop()}](${repo}${b.dir}/${chapter}.md)`).join(", ")} |`;
      });
    }),
    "",
    "## Live checks",
    "",
    ...(ran.length === 0
      ? ["No build in this range has been checked against a live client."]
      : [
          "| Build | Passed | Failed | Skipped | Commit | Date |",
          "| --- | --- | --- | --- | --- | --- |",
          ...ran.map((r) => {
            const n = (o: string): number =>
              r.checks.filter((c) => c.outcome === o).length;
            return `| [${r.build}](${repo}${RESULTS}/${slug(r.build)}.json) | ${n("passed")} | ${n("failed")} | ${n("skipped")} | ${r.commit.slice(0, 7)} | ${r.date} |`;
          }),
        ]),
    "",
    "## Vectors",
    "",
    `${vectorsIn(range).length} vectors are laid out as a build in this range lays its messages out.`,
  ];
  if (lacks.length > 0)
    lines.push(
      "",
      "## Not recorded",
      "",
      `The nearest ranges on either side of this one that define these both do, and this one does not. The specification says nothing of whether a build in it sends or takes them: ${lacks.map((m) => `[\`${m.message}\`](${repo}schema/messages/${m.file})`).join(", ")}.`,
    );
  return lines;
}

// 4. A season's page, and the site's.
const rangeRow = (r: Range, from: string): string => {
  const ran = results.filter((x) => covers(r, x.build)).length;
  const i = ranges.indexOf(r);
  return `| [${rangeName(r)}](${from}${folderOf(r).split("/").pop()}/README.md) | ${r.from} | ${r.until ?? "on"} | ${ran} | ${i === 0 ? "" : `[changes](${from}${folderOf(r).split("/").pop()}/changes.md)`} | [book](${from}${folderOf(r).split("/").pop()}/book.md) |`;
};
const RANGE_HEAD = [
  "| Range | From | Up to | Builds checked | From the one before | Book |",
  "| --- | --- | --- | --- | --- | --- |",
];

for (const [i, r] of ranges.entries()) {
  const dir = folderOf(r);
  put(`${dir}/README.md`, rangePage(i, `${dir}/README.md`));
  put(`${dir}/messages.md`, messagesPage(r, `${dir}/messages.md`));
  const prev = ranges[i - 1];
  if (prev !== undefined)
    put(`${dir}/changes.md`, changesPage(prev, r, `${dir}/changes.md`));
}
const held = seasons.filter((s) => ranges.some((r) => seasonOf(r) === s));
for (const s of held) {
  const own = ranges.filter((r) => seasonOf(r) === s);
  put(`${s.folder}/README.md`, [
    `# ${s.name}`,
    "",
    `The ranges of versions the specification covers in ${s.name}. The wiki lists [every patch of ${s.name}](${s.patches}), with its notes.`,
    "",
    ...RANGE_HEAD,
    ...own.map((r) => rangeRow(r, "")),
  ]);
}
put("README.md", [
  "# Trueshot",
  "",
  `Generated from the [repository](../../) by \`bun run site\`. The [chapters](../../spec/README.md) hold for every range; each range below has its own book, every message it sends or takes, and how it differs from the range before it.`,
  "",
  ...held.flatMap((s) => [
    `## [${s.name}](${s.folder}/README.md)`,
    "",
    ...RANGE_HEAD,
    ...ranges
      .filter((r) => seasonOf(r) === s)
      .map((r) => rangeRow(r, `${s.folder}/`)),
    "",
  ]),
]);

rmSync(SITE, { recursive: true, force: true });
for (const [path, text] of pages) {
  const full = join(SITE, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
}
// The books go beside the pages, so a site is never left without them.
const books = Bun.spawnSync(
  ["bun", join(ROOT, "scripts/book.ts"), ...process.argv.slice(2)],
  { stdout: "inherit", stderr: "inherit" },
);
if (books.exitCode !== 0) process.exit(books.exitCode);
console.log(
  `wrote ${pages.size} pages for ${ranges.length} ranges in ${held.length} seasons to dist/site`,
);
