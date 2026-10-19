// Write what is generated from schema/ into the prose, so the two cannot drift.
//
//   bun scripts/generate.ts          rewrite the generated parts
//   bun scripts/generate.ts --check  fail where a generated part is out of date
//
// 1. In each spec/<system>.md, the block between the markers
//    <!-- messages:begin --> and <!-- messages:end --> becomes a table of the
//    messages whose definition names that system, with the command and channel
//    each takes in every range of versions.
//    Likewise the table between <!-- ranges:begin --> and <!-- ranges:end -->
//    in spec/versions.md lists the ranges the definitions make.
// 2. spec/reference/<first build>.md is written for each range of versions the
//    channels are defined for: every channel, then every message by system,
//    with its fields as that range lays them out.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import * as prettier from "prettier";
import { covers, ranges as coveredRanges } from "./schema.ts";
import type { Amount, Channel, Field, Presence, Revision } from "./schema.ts";

interface MessageFile {
  readonly file: string;
  readonly message: string;
  readonly system: string;
  readonly note?: string;
  readonly revisions: readonly Revision[];
}

interface Range {
  readonly from: string;
  readonly until?: string;
  readonly channels: readonly Channel[];
}

const ROOT = join(import.meta.dir, "..");
const check = process.argv.includes("--check");
const json = <T>(path: string): T =>
  JSON.parse(readFileSync(join(ROOT, path), "utf8")) as T;

// Each range with the channels that cover it, for its reference page.
const channelRevisions = json<{ revisions: Range[] }>(
  "schema/channels.json",
).revisions;
const ranges: Range[] = coveredRanges().map((r) => ({
  ...r,
  channels: channelRevisions.find((c) => covers(c, r.from))?.channels ?? [],
}));
const label = (r: Range): string =>
  r.until === undefined ? `${r.from} on` : `${r.from} to ${r.until}`;
const short = (r: Range): string => r.from.split(".").slice(0, 2).join(".");
const systems = json<{ properties: { system: { enum: string[] } } }>(
  "schema/meta/message.json",
).properties.system.enum;
const messages: MessageFile[] = readdirSync(join(ROOT, "schema/messages"))
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((file) => ({
    file,
    ...json<Omit<MessageFile, "file">>(`schema/messages/${file}`),
  }));

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
  r?.direction === "clientToServer" ? "client" : "server";
const cell = (m: MessageFile, range: Range): string => {
  const r = revisionAt(m, range.from);
  return r === undefined ? "none" : `${r.command} on ${r.channel}`;
};

// 1. The tables in the system documents.
const BEGIN = "<!-- messages:begin -->";
const END = "<!-- messages:end -->";
const table = (system: string, link: string): string => {
  const rows = messages.filter((m) => m.system === system);
  const head = `| Message | Sent by | ${ranges.map(short).join(" | ")} | What it does |`;
  const rule = `| --- | --- | ${ranges.map(() => "---").join(" | ")} | --- |`;
  const body = rows.map(
    (m) =>
      `| [\`${m.message}\`](${link}${m.file}) | ${by(m.revisions[0])} | ${ranges.map((r) => cell(m, r)).join(" | ")} | ${firstSentence(m.note)} |`,
  );
  return [BEGIN, "", head, rule, ...body, "", END].join("\n");
};

const stale: string[] = [];
// Formatted as the repository formats markdown, so check:format agrees.
const options = {
  ...(await prettier.resolveConfig(join(ROOT, "spec/x.md"))),
  parser: "markdown",
};
const pending: [string, string][] = [];
const put = (path: string, text: string): void => {
  pending.push([path, text]);
};
const flush = async (path: string, raw: string): Promise<void> => {
  const text = await prettier.format(raw, options);
  const full = join(ROOT, path);
  const old = existsSync(full) ? readFileSync(full, "utf8") : null;
  if (old === text) return;
  if (check) {
    stale.push(path);
    return;
  }
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
  console.log("wrote", path);
};

for (const s of systems) {
  const path = `spec/${s}.md`;
  const full = join(ROOT, path);
  if (!existsSync(full)) {
    stale.push(`${path} (missing: every system has a document)`);
    continue;
  }
  const text = readFileSync(full, "utf8");
  const a = text.indexOf(BEGIN);
  const b = text.indexOf(END);
  if (a < 0 || b < 0) {
    stale.push(`${path} (no ${BEGIN} block)`);
    continue;
  }
  put(
    path,
    text.slice(0, a) +
      table(s, "../schema/messages/") +
      text.slice(b + END.length),
  );
}

// 1b. The table of ranges in spec/versions.md.
{
  const path = "spec/versions.md";
  const text = readFileSync(join(ROOT, path), "utf8");
  const open = "<!-- ranges:begin -->";
  const close = "<!-- ranges:end -->";
  const a = text.indexOf(open);
  const b = text.indexOf(close);
  if (a < 0 || b < 0) stale.push(`${path} (no ${open} block)`);
  else {
    const rows = ranges.map(
      (r) => `| ${short(r)} | ${r.from} | ${r.until ?? "on"} |`,
    );
    const table = [
      open,
      "",
      "| Range | From | Up to |",
      "| --- | --- | --- |",
      ...rows,
      "",
      close,
    ].join("\n");
    put(path, text.slice(0, a) + table + text.slice(b + close.length));
  }
}

// 2. One reference page per range of versions.
const structFiles = new Map(
  readdirSync(join(ROOT, "schema/types"))
    .filter((f) => f.endsWith(".json"))
    .map(
      (file) =>
        [
          json<{ struct: string }>(`schema/types/${file}`).struct,
          file,
        ] as const,
    ),
);
const named = (a: Amount | "remaining" | "terminated"): string =>
  typeof a === "string" ? a : JSON.stringify(a);
const structLink = (name: string): string =>
  `[${name}](../../schema/types/${structFiles.get(name)})`;
const typeOf = (f: Field): string => {
  switch (f.type) {
    case "string":
      return `text, ${typeof f.size === "number" ? `${f.size} bytes` : f.size === "terminated" ? "ended by a zero byte" : `sized by ${named(f.size)}`}`;
    case "bytes":
      return `bytes, ${typeof f.size === "number" ? f.size : typeof f.size === "string" ? `sized by ${f.size}` : JSON.stringify(f.size)}`;
    case "bits":
      return `${f.size}-byte bits: ${f.bits.map((b) => `${b.name} (${b.width})`).join(", ")}`;
    case "array": {
      const count =
        f.size !== undefined
          ? `sized by ${named(f.size)}`
          : f.count === "remaining" || f.count === undefined
            ? "to the end"
            : typeof f.count === "number"
              ? f.count
              : `count in ${named(f.count)}`;
      const item =
        f.items.type === "record"
          ? "record"
          : f.items.type === "struct"
            ? structLink(f.items.struct)
            : f.items.type;
      return `${count} × ${item}`;
    }
    case "struct":
      return structLink(f.struct);
    case "record":
      return "record";
    default:
      return f.type;
  }
};
const presence = (p: Presence | undefined): string =>
  p === undefined
    ? ""
    : p.equals !== undefined
      ? `${p.when} = ${([] as number[]).concat(p.equals).join(" or ")}`
      : JSON.stringify(p).replace(/[{}"]/g, "").replace(/,/g, ", ");
const lead = (note = ""): string => {
  const end = note.search(/\.(\s|$)/);
  return (end >= 0 ? note.slice(0, end + 1) : note).replace(/\|/g, "\\|");
};
const fieldRows = (fields: readonly Field[] | null, depth = 0): string[] =>
  (fields ?? []).flatMap((f) => [
    `| ${"&nbsp;&nbsp;".repeat(depth)}${f.name} | ${typeOf(f)} | ${presence(f.present)} | ${lead(f.note)} |`,
    ...fieldRows(
      f.type === "record"
        ? f.fields
        : f.type === "array" && f.items.type === "record"
          ? f.items.fields
          : null,
      depth + 1,
    ),
  ]);

for (const range of ranges) {
  const lines = [
    `# Messages of ${label(range)}`,
    "",
    `Generated from \`schema/\` by \`scripts/generate.ts\`: do not edit by hand. Every message a build from ${range.from}${range.until === undefined ? " on" : ` up to, not including, ${range.until}`} sends or takes, by system, with the layout of its body after the header its channel's family puts in front. What each message and field means is in its definition, and how a system's messages work together is in the system's document.`,
    "",
    "## Channels",
    "",
    "| Channel | Name | Family |",
    "| --- | --- | --- |",
    ...range.channels.map((c) => `| ${c.id} | ${c.name} | ${c.family} |`),
  ];
  for (const s of systems) {
    const here = messages.filter(
      (m) => m.system === s && revisionAt(m, range.from) !== undefined,
    );
    if (here.length === 0) continue;
    lines.push(
      "",
      `## ${s.charAt(0).toUpperCase() + s.slice(1)}`,
      "",
      `See [${s}](../${s}.md).`,
    );
    for (const m of here) {
      const r = revisionAt(m, range.from);
      if (r === undefined) continue;
      lines.push(
        "",
        `### ${m.message}`,
        "",
        `Command ${r.command} on ${r.channel}, sent by the ${by(r)}, ${r.reliability}. [Definition](../../schema/messages/${m.file}).`,
      );
      if (r.fields.length > 0) {
        lines.push(
          "",
          "| Field | Type | Present when | What it is |",
          "| --- | --- | --- | --- |",
          ...fieldRows(r.fields),
        );
      } else lines.push("", "No body.");
    }
  }
  put(
    `spec/reference/${range.from.replace(/\./g, "-")}.md`,
    `${lines.join("\n")}\n`,
  );
}

for (const [path, text] of pending) await flush(path, text);
if (stale.length > 0) {
  console.error(
    `Generated text is out of date (run bun run generate):\n  ${stale.join("\n  ")}`,
  );
  process.exit(1);
}
if (check) {
  console.log(
    `Generated text is up to date for ${systems.length} systems and ${ranges.length} ranges of versions.`,
  );
}
