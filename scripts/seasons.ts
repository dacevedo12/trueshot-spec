// Where each range of versions sits in the generated site: the season it
// belongs to, from spec/seasons.json, and the folder its pages go in.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compare, covers } from "./schema.ts";
import type { Ranged } from "./schema.ts";
import { checked, rangeName } from "./tables.ts";

interface Season {
  readonly name: string;
  readonly folder: string;
  readonly from?: string;
  readonly until?: string;
  readonly patches: string;
}

const ROOT = join(import.meta.dir, "..");
const data = JSON.parse(
  readFileSync(join(ROOT, "spec/seasons.json"), "utf8"),
) as { patchNotes: string; seasons: Season[] };
const seasons: readonly Season[] = data.seasons;

const span = (s: Season): Ranged => ({
  from: s.from ?? "0.0.0.0",
  ...(s.until === undefined ? {} : { until: s.until }),
});

// The season a range's first build falls in.
function seasonOf(r: Ranged): Season {
  const found = seasons.filter((s) => covers(span(s), r.from));
  if (found.length !== 1 || found[0] === undefined)
    throw new Error(
      `spec/seasons.json puts ${r.from} in ${found.length} seasons, not one`,
    );
  return found[0];
}

// A range's folder under its season, named as the range is, with a hyphen:
// season-4/4.18-4.19.
const folderOf = (r: Ranged): string =>
  `${seasonOf(r).folder}/${rangeName(r).replace("–", "-")}`;

// The patches a range spans, with a link to each one's notes: every patch
// from its first build's to its last checked build's. A 1.0 patch is named
// by its whole build.
function patchesOf(r: Ranged): { name: string; url: string }[] {
  const link = (name: string): { name: string; url: string } => ({
    name,
    url: data.patchNotes.replace("{patch}", name),
  });
  const inside = [r.from, ...checked.filter((b) => covers(r, b))].sort(
    compare,
  );
  if (r.from.startsWith("1.0.")) return [...new Set(inside)].map(link);
  const [major = "", first = ""] = r.from.split(".");
  const last = (inside[inside.length - 1] ?? r.from).split(".")[1] ?? first;
  const out: { name: string; url: string }[] = [];
  for (let minor = Number(first); minor <= Number(last); minor += 1)
    out.push(link(`${major}.${minor}`));
  return out;
}

export { folderOf, patchesOf, seasonOf, seasons };
export type { Season };
