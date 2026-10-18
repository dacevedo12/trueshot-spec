// spec/joining.md, end to end: a client with nothing but the least a server
// must send reaches play, and stays there.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { setup } from "../src/client.ts";
import { Match } from "../src/match.ts";

const s = setup();

describe.skipIf(s === undefined)("joining", () => {
  let match: Match;

  beforeAll(async () => {
    if (s === undefined) return;
    match = new Match(s, { name: "joining" });
    await match.start();
  });

  afterAll(async () => {
    await match.stop();
  });

  test("a client registers with the key it was launched with", async () => {
    await match.reach("registered", 120_000);
  }, 130_000);

  test("a client states its build and asks for a seat", async () => {
    await match.reach("seated", 60_000);
  }, 70_000);

  test("a client settles its character after loading", async () => {
    await match.reach("selected", 180_000);
  }, 190_000);

  test("a client answers the spawn run with ClientReady", async () => {
    await match.reach("ready", 60_000);
  }, 70_000);

  test("a client answers ClockSync with ClockReply", async () => {
    const session = match.session;
    if (session === undefined) throw new Error("no session");
    const reply = await session.next("ClockReply", {
      seen: true,
      timeout: 30_000,
    });
    expect(reply.fields["serverSaid"]).toBe(0);
  }, 40_000);

  test("a client in play sends view reports", async () => {
    const session = match.session;
    if (session === undefined) throw new Error("no session");
    await session.next("Camera", { seen: true, timeout: 30_000 });
  }, 40_000);

  test("a client stays in play for 30 seconds", async () => {
    await Bun.sleep(30_000);
    expect(match.disconnected).toBeUndefined();
    expect(match.client.running).toBe(true);
    await match.screenshot("in-play");
  }, 45_000);
});
