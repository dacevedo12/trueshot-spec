// spec/vision.md and spec/movement.md: a champion a server brings into view
// is drawn, and a path a server sends it walks, which the client answers.
// It runs where EnterSight can state where a unit stands without the rest of
// what the unit is.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { layoutsOf, setup } from "../src/client.ts";
import { Match } from "../src/match.ts";

const s = setup();
const layouts = s === undefined ? undefined : layoutsOf(s);
const sight = layouts?.messages.get("EnterSight");
const runs =
  sight !== undefined &&
  sight.fields.some((f) => f.name === "movementKind") &&
  layouts?.messages.has("WaypointGroup") === true &&
  layouts.messages.has("WaypointAck");

// Path coordinates are measured in steps of two world units from the map's
// origin (spec/space.md); map 1's is 6991, 7223.
const ORIGIN = { x: 6991, z: 7223 };
const toPath = (x: number, z: number): { x: number; z: number } => ({
  x: Math.trunc((x - ORIGIN.x) / 2),
  z: Math.trunc((z - ORIGIN.z) / 2),
});

describe.skipIf(!runs)("movement", () => {
  let match: Match;

  beforeAll(async () => {
    if (s === undefined) return;
    match = new Match(s, {
      name: "movement",
      play: (session) => {
        const champion = match.seat.netId;
        setTimeout(() => {
          session.send("EnterSight", {
            netId: champion,
            movementKind: 0,
            syncId: 1,
          });
        }, 2_000);
        // Put the champion at one point and walk it to another.
        const from = toPath(1500, 1500);
        const to = toPath(2500, 1500);
        setTimeout(() => {
          session.send("WaypointGroup", {
            syncId: 2,
            movementCount: 1,
            movements: [
              {
                header: {
                  hasTeleportToken: 1,
                  unused: 0,
                  pointCount: 2,
                  unusedHigh: 0,
                },
                unit: champion,
                teleportToken: 1,
                flags: [{ xIsStep: 0, zIsStep: 0 }],
                firstX: from.x,
                firstZ: from.z,
                steps: [{ xWhole: to.x, zWhole: to.z }],
              },
            ],
          });
        }, 5_000);
      },
    });
    await match.start();
    await match.reach("playing", 300_000);
  }, 310_000);

  afterAll(async () => {
    await match.stop();
  });

  test("a client answers WaypointGroup with WaypointAck", async () => {
    const session = match.session;
    if (session === undefined) throw new Error("no session");
    const ack = await session.next("WaypointAck", { timeout: 20_000 });
    expect(ack.fields["syncId"]).toBe(2);
  }, 30_000);

  test("a champion brought into view is drawn and walks its path", async () => {
    await Bun.sleep(6_000);
    expect(match.alive).toBe(true);
    await match.look(
      "walked",
      "the champion stands on the field, away from the fountain, having walked",
    );
  }, 20_000);

  test("a champion taken out of view is no longer drawn", async () => {
    match.session?.send("LeaveSight", { netId: match.seat.netId });
    await Bun.sleep(3_000);
    expect(match.alive).toBe(true);
    await match.look("hidden", "the champion is no longer drawn on the field");
  }, 20_000);
});
