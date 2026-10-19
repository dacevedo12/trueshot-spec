// Every message a server sends, from the vectors, laid out under the build's
// revisions and sent to a client in play. A client that takes them all and
// stays in play reads each one without failing; what each one does is the
// business of the checks about its system.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Values } from "../../../scripts/codec.ts";
import { unhex } from "../../../scripts/codec.ts";
import { decodeMessage } from "../../../scripts/message.ts";
import type { Layouts } from "../../../scripts/schema.ts";
import { layoutsOf, setup } from "../src/client.ts";
import { Match } from "../src/match.ts";

const s = setup();

// What the specification says not to send, or what ends or remakes the match
// a sweep runs in, and so cannot be swept.
const LEFT_OUT = new Map<string, string>([
  ["NavigationFlags", "spec/movement.md: a server MUST NOT send it"],
  ["GameEnded", "it ends the match"],
  ["BotKick", "it can make the client leave"],
  ["Shutdown", "it ends the match"],
  ["SoftReconnect", "it rebuilds the client's world"],
  ["Paused", "it holds the match"],
  ["CreateChampion", "it can hand the client another champion"],
]);
// The steps of joining, already taken, and the stream a watching client reads.
const SYSTEMS_LEFT_OUT = new Set(["joining", "spectating"]);

interface Vector {
  readonly subject: string;
  readonly message?: string;
  readonly version?: string;
  readonly channel?: string;
  readonly fields?: Values;
  readonly bytes?: string;
}

const VECTORS = join(import.meta.dir, "..", "..", "vectors");

function sweepFor(
  layouts: Layouts,
  build: string,
): { name: string; channel: string; fields: Values }[] {
  const systems = new Map<string, string>();
  for (const file of readdirSync(
    join(import.meta.dir, "..", "..", "..", "schema", "messages"),
  )) {
    if (!file.endsWith(".json")) continue;
    const m = JSON.parse(
      readFileSync(
        join(import.meta.dir, "..", "..", "..", "schema", "messages", file),
        "utf8",
      ),
    ) as {
      message: string;
      system: string;
    };
    systems.set(m.message, m.system);
  }
  // Of the vectors that read under the served revision, the one recorded
  // nearest the client's build is taken, since what a vector names (a map's
  // art, a champion) can be missing from a build far from it.
  const distance = (version: string): number => {
    const a = version.split(".").map(Number);
    const b = build.split(".").map(Number);
    return a.reduce((t, x, i) => t * 1_000_000 + Math.abs(x - (b[i] ?? 0)), 0);
  };
  const best = new Map<
    string,
    { name: string; channel: string; fields: Values; distance: number }
  >();
  for (const dir of readdirSync(VECTORS).sort()) {
    for (const file of readdirSync(join(VECTORS, dir)).sort()) {
      const v = JSON.parse(
        readFileSync(join(VECTORS, dir, file), "utf8"),
      ) as Vector;
      if (
        v.subject !== "message" ||
        v.message === undefined ||
        v.version === undefined ||
        v.fields === undefined
      )
        continue;
      const revision = layouts.messages.get(v.message);
      if (revision === undefined || revision.direction === "clientToServer")
        continue;
      if (
        LEFT_OUT.has(v.message) ||
        SYSTEMS_LEFT_OUT.has(systems.get(v.message) ?? "")
      )
        continue;
      // One payload of each message, on each channel it travels on.
      const channel = v.channel ?? revision.channel;
      // A vector stands for the served revision where its bytes read under
      // it whole: the same bytes on the wire, whatever each revision calls
      // its fields. It is sent as that revision reads it.
      let fields: Values;
      try {
        const read = decodeMessage(
          layouts,
          layouts.channel(channel),
          unhex(v.bytes ?? ""),
          false,
        );
        if (read.name !== v.message) continue;
        fields = read.fields;
      } catch {
        continue;
      }
      const key = `${v.message}/${channel}`;
      const d = distance(v.version);
      const held = best.get(key);
      if (held !== undefined && held.distance <= d) continue;
      best.set(key, { name: v.message, channel, fields, distance: d });
    }
  }
  const out = [...best.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, channel, fields }) => ({ name, channel, fields }));
  // spec/spells.md: a server MUST NOT put a spell in a marker's slot, which
  // two vectors can do between them by naming the same net id.
  const markers = new Set(
    out.filter((m) => m.name === "SpawnMarker").map((m) => m.fields["unit"]),
  );
  // spec/objects.md: a 4.17 server MUST NOT move a region a client does not
  // hold, so a region is moved only where the sweep added it.
  const regions = new Set(
    out.filter((m) => m.name === "RegionAdded").map((m) => m.fields["marker"]),
  );
  return out.filter(
    (m) =>
      (m.name !== "SpellInSlot" || !markers.has(m.fields["unit"])) &&
      (m.name !== "RegionMoved" || regions.has(m.fields["region"])),
  );
}

// TRUESHOT_SWEEP narrows a sweep to the messages it names, separated by
// commas, and TRUESHOT_SWEEP_GAP spaces them further apart, in milliseconds:
// together they find which message a client fails on.
const ONLY = new Set(
  (Bun.env["TRUESHOT_SWEEP"] ?? "").split(",").filter((n) => n !== ""),
);
const GAP = Number(Bun.env["TRUESHOT_SWEEP_GAP"] ?? 150);
// TRUESHOT_SWEEP_SKIP leaves out the messages it names, for a trial whose
// client lacks what a vector names: a turret whose art came in a later build.
const SKIP = new Set(
  (Bun.env["TRUESHOT_SWEEP_SKIP"] ?? "").split(",").filter((n) => n !== ""),
);
// How long a client is watched after the last message. Some messages take
// effect late, so a failure can come well after its cause.
const WAIT = Number(Bun.env["TRUESHOT_SWEEP_WAIT"] ?? 45_000);

describe.skipIf(s === undefined)("sweep", () => {
  let match: Match;
  const sent: { name: string; at: number }[] = [];
  let total = 0;

  beforeAll(async () => {
    if (s === undefined) return;
    const sweep = sweepFor(layoutsOf(s), s.build).filter(
      (m) => (ONLY.size === 0 || ONLY.has(m.name)) && !SKIP.has(m.name),
    );
    total = sweep.length;
    match = new Match(s, {
      name: "sweep",
      play: (session) => {
        sweep.forEach((m, i) => {
          setTimeout(
            () => {
              if (match.stopped !== undefined) return;
              sent.push({ name: m.name, at: Date.now() });
              session.send(m.name, m.fields, { channel: m.channel });
            },
            5_000 + i * GAP,
          );
        });
      },
    });
    await match.start();
    await match.reach("playing", 300_000);
  }, 310_000);

  afterAll(async () => {
    await match.stop();
  });

  test("a client in play takes every message a server sends, and stays", async () => {
    await Bun.sleep(5_000 + total * GAP + WAIT);
    const last = sent
      .slice(-3)
      .map((m) => m.name)
      .join(", ");
    expect(
      match.alive,
      `the client left after ${sent.length} of ${total} messages (${match.stopped ?? "it exited"}); the last were ${last}`,
    ).toBe(true);
    expect(sent.length).toBe(total);
    await match.look(
      "sweep",
      "the client is in play, whatever the messages drew",
    );
  }, 300_000);

  // spec/ordering.md, "Answers a server waits for", and spec/communication.md
  // for a voice event. A Replication batch is answered only where every unit
  // it names is held, which a vector's batch does not promise, so it is not
  // asked for here.
  for (const [asked, answer] of [
    ["WaypointGroup", "WaypointAck"],
    ["VoiceEvent", "VoiceEventDone"],
  ] as const) {
    // Only where the range defines both.
    const both =
      s !== undefined &&
      layoutsOf(s).messages.has(asked) &&
      layoutsOf(s).messages.has(answer);
    test.skipIf(!both)(
      `a client answers ${asked} with ${answer}`,
      async () => {
        const session = match.session;
        if (session === undefined) throw new Error("no session");
        const at = sent.find((m) => m.name === asked)?.at;
        expect(at, `the sweep sent no ${asked}`).toBeDefined();
        await session.next(answer, {
          seen: true,
          timeout: 5_000,
        });
      },
      10_000,
    );
  }
});
