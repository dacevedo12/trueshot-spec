// Write what is generated from schema/ into the prose, so the two cannot drift.
//
//   node scripts/generate.mjs          rewrite the generated parts
//   node scripts/generate.mjs --check  fail where a generated part is out of date
//
// 1. In each spec/<system>.md, the block between the markers
//    <!-- messages:begin --> and <!-- messages:end --> becomes a table of the
//    messages whose definition names that system, with the command and channel
//    each takes in every range of versions.
// 2. spec/reference/<first build>.md is written for each range of versions the
//    channels are defined for: every channel, then every message by system,
//    with its fields as that range lays them out.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const j = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const parse = (v) => v.split(".").map(Number);
const cmp = (a, b) => { const x = parse(a), y = parse(b); for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
const covers = (r, build) => cmp(build, r.from) >= 0 && (!r.until || cmp(build, r.until) < 0);

const ranges = j("schema/channels.json").revisions.map((r) => ({ from: r.from, until: r.until, channels: r.channels }));
const label = (r) => (r.until ? `${r.from} to ${r.until}` : `${r.from} on`);
const short = (r) => r.from.split(".").slice(0, 2).join(".");
const meta = j("schema/meta/message.json");
const systems = meta.properties.system.enum;
const messages = readdirSync(join(ROOT, "schema/messages")).filter((f) => f.endsWith(".json")).sort()
  .map((f) => ({ file: f, ...j(`schema/messages/${f}`) }));

// A note's first sentence; "What a server sends to do something" becomes
// "Do something", and any other opening is kept whole.
const firstSentence = (note = "") => {
  const end = note.search(/\.(\s|$)/);
  const t = end >= 0 ? note.slice(0, end) : note;
  const m = t.match(/^What (?:a|the) (?:server|client) sends to (.*)$/);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : t;
};
const by = (r) => (r.direction === "clientToServer" ? "client" : "server");
const cell = (m, range) => {
  const r = m.revisions.find((x) => covers(x, range.from));
  return r ? `${r.command} on ${r.channel}` : "none";
};

// 1. The tables in the system documents.
const BEGIN = "<!-- messages:begin -->", END = "<!-- messages:end -->";
const table = (system, link) => {
  const rows = messages.filter((m) => m.system === system);
  const head = `| Message | Sent by | ${ranges.map(short).join(" | ")} | What it does |`;
  const rule = `| --- | --- | ${ranges.map(() => "---").join(" | ")} | --- |`;
  const body = rows.map((m) => `| [\`${m.message}\`](${link}${m.file}) | ${by(m.revisions[0])} | ${ranges.map((r) => cell(m, r)).join(" | ")} | ${firstSentence(m.note)} |`);
  return [BEGIN, "", head, rule, ...body, "", END].join("\n");
};
let stale = [];
// Formatted as the repository formats markdown, so check:format agrees.
const prettier = await import("prettier");
const options = { ...(await prettier.resolveConfig(join(ROOT, "spec/x.md"))), parser: "markdown" };
const pending = [];
const put = (path, text) => pending.push([path, text]);
const flush = async (path, raw) => {
  const text = await prettier.format(raw, options);
  const full = join(ROOT, path);
  const old = existsSync(full) ? readFileSync(full, "utf8") : null;
  if (old === text) return;
  if (check) { stale.push(path); return; }
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
  console.log("wrote", path);
};
for (const s of systems) {
  const path = `spec/${s}.md`;
  const full = join(ROOT, path);
  if (!existsSync(full)) { stale.push(`${path} (missing: every system has a document)`); continue; }
  const text = readFileSync(full, "utf8");
  const a = text.indexOf(BEGIN), b = text.indexOf(END);
  if (a < 0 || b < 0) { stale.push(`${path} (no ${BEGIN} block)`); continue; }
  put(path, text.slice(0, a) + table(s, "../schema/messages/") + text.slice(b + END.length));
}

// 2. One reference page per range of versions.
const structs = new Map(readdirSync(join(ROOT, "schema/types")).filter((f) => f.endsWith(".json")).map((f) => { const s = j(`schema/types/${f}`); return [s.struct, { ...s, file: f }]; }));
const typeOf = (f) => {
  switch (f.type) {
    case "string": return `text, ${typeof f.size === "number" ? `${f.size} bytes` : f.size === "terminated" ? "ended by a zero byte" : `sized by ${typeof f.size === "string" ? f.size : JSON.stringify(f.size)}`}`;
    case "bytes": return `bytes, ${typeof f.size === "number" ? f.size : typeof f.size === "string" ? `sized by ${f.size}` : JSON.stringify(f.size)}`;
    case "bits": return `${f.size}-byte bits: ${f.bits.map((b) => `${b.name} (${b.width})`).join(", ")}`;
    case "array": return `${f.count === "remaining" ? "to the end" : typeof f.count === "number" ? f.count : `count in ${typeof f.count === "string" ? f.count : JSON.stringify(f.count)}`} × ${f.items.type === "record" ? "record" : f.items.type === "struct" ? `[${f.items.struct}](../../schema/types/${structs.get(f.items.struct)?.file})` : f.items.type}`;
    case "struct": return `[${f.struct}](../../schema/types/${structs.get(f.struct)?.file})`;
    case "record": return "record";
    default: return f.type;
  }
};
const presence = (p) => (!p ? "" : typeof p.when === "string" && "equals" in p ? `${p.when} = ${[].concat(p.equals).join(" or ")}` : JSON.stringify(p).replace(/[{}"]/g, "").replace(/,/g, ", "));
const lead = (note = "") => { const end = note.search(/\.(\s|$)/); return (end >= 0 ? note.slice(0, end + 1) : note).replace(/\|/g, "\\|"); };
const fieldRows = (fields, depth = 0) => (fields ?? []).flatMap((f) => [
  `| ${"&nbsp;&nbsp;".repeat(depth)}${f.name} | ${typeOf(f)} | ${presence(f.present)} | ${lead(f.note)} |`,
  ...fieldRows(f.type === "record" ? f.fields : f.type === "array" && f.items.type === "record" ? f.items.fields : null, depth + 1),
]);
for (const range of ranges) {
  const lines = [
    `# Messages of ${label(range)}`,
    "",
    `Generated from \`schema/\` by \`scripts/generate.mjs\`: do not edit by hand. Every message a build from ${range.from}${range.until ? ` up to, not including, ${range.until}` : " on"} sends or takes, by system, with the layout of its body after the header its channel's family puts in front. What each message and field means is in its definition, and how a system's messages work together is in the system's document.`,
    "",
    "## Channels",
    "",
    "| Channel | Name | Family |",
    "| --- | --- | --- |",
    ...range.channels.map((c) => `| ${c.id} | ${c.name} | ${c.family} |`),
  ];
  for (const s of systems) {
    const here = messages.filter((m) => m.system === s && m.revisions.some((r) => covers(r, range.from)));
    if (!here.length) continue;
    lines.push("", `## ${s.charAt(0).toUpperCase() + s.slice(1)}`, "", `See [${s}](../${s}.md).`);
    for (const m of here) {
      const r = m.revisions.find((x) => covers(x, range.from));
      lines.push("", `### ${m.message}`, "", `Command ${r.command} on ${r.channel}, sent by the ${by(r)}, ${r.reliability}. [Definition](../../schema/messages/${m.file}).`);
      if (r.fields?.length) lines.push("", "| Field | Type | Present when | What it is |", "| --- | --- | --- | --- |", ...fieldRows(r.fields));
      else lines.push("", "No body.");
    }
  }
  put(`spec/reference/${range.from.replace(/\./g, "-")}.md`, lines.join("\n") + "\n");
}

for (const [path, text] of pending) await flush(path, text);
if (stale.length) {
  console.error(`Generated text is out of date (run node scripts/generate.mjs):\n  ${stale.join("\n  ")}`);
  process.exit(1);
}
if (check) console.log(`Generated text is up to date for ${systems.length} systems and ${ranges.length} ranges of versions.`);
