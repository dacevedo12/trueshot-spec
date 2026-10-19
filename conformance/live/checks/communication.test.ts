// spec/communication.md: a line a server puts in a client's chat.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { layoutsOf, setup } from "../src/client.ts";
import { Match } from "../src/match.ts";

const s = setup();
const LINE = "trueshot: a line of the server's own";

// A range without SystemMessage has nothing here to check.
const defined = s !== undefined && layoutsOf(s).messages.has("SystemMessage");

describe.skipIf(!defined)("communication", () => {
  let match: Match;

  beforeAll(async () => {
    if (s === undefined) return;
    match = new Match(s, {
      name: "communication",
      play: (session) => {
        setTimeout(() => session.send("SystemMessage", { text: LINE }), 3_000);
      },
    });
    await match.start();
    await match.reach("playing", 300_000);
  }, 310_000);

  afterAll(async () => {
    await match.stop();
  });

  test("a client takes SystemMessage and stays in play", async () => {
    await Bun.sleep(8_000);
    expect(match.alive).toBe(true);
    await match.look("system-message", `the chat shows "${LINE}"`);
  }, 20_000);
});
