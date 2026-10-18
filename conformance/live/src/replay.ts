// Runs a capture again against the client the environment names. The match
// brings the client into play as it always does; what a check sent on top is
// re-sent by name and fields, in the spawn run or at the time it went out
// after play began. The fields are encoded under the running build's layouts,
// so a capture made on one build can be replayed on another that has the same
// messages.
//
//   bun --env-file=<your env file> run replay <capture directory> [seconds]

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Entry } from "./capture.ts";
import { setup } from "./client.ts";
import { isRecord } from "./codec.ts";
import { Match } from "./match.ts";

type Sent = Extract<Entry, { kind: "message" }>;

const [directory, seconds = "60"] = process.argv.slice(2);
const s = setup();
if (directory === undefined || s === undefined) {
  console.error(
    "usage: bun --env-file=<env> run replay <capture directory> [seconds]",
  );
  process.exit(2);
}

const entries = readFileSync(join(directory, "events.jsonl"), "utf8")
  .split("\n")
  .filter((line) => line.length > 0)
  .map((line) => JSON.parse(line) as Entry);
const sent = entries.filter(
  (e): e is Sent => e.kind === "message" && e.direction === "out",
);

const start = sent.findIndex((e) => e.name === "SpawnStart");
const end = sent.findIndex((e) => e.name === "SpawnEnd");
const began = sent.find((e) => e.name === "StartGame");
const scripted = (e: Sent): boolean => e.answer !== true && isRecord(e.fields);
const spawnRun =
  start === -1 || end === -1
    ? []
    : sent.slice(start + 1, end).filter(scripted);
const afterwards =
  began === undefined
    ? []
    : sent.filter((e) => e.at > began.at && scripted(e));

console.log(
  `replaying ${spawnRun.length} messages in the spawn run and ${afterwards.length} after play began`,
);

const match = new Match(s, {
  name: "replay",
  spawn: (session) => {
    for (const e of spawnRun)
      if (isRecord(e.fields))
        session.send(e.name, e.fields, { channel: e.channel });
  },
  play: (session) => {
    const zero = began?.at ?? 0;
    for (const e of afterwards) {
      setTimeout(() => {
        if (isRecord(e.fields))
          session.send(e.name, e.fields, { channel: e.channel });
      }, e.at - zero);
    }
  },
});
await match.start();
await match.reach("playing");
await Bun.sleep(Number(seconds) * 1000);
await match.screenshot("replayed");
const alive = match.alive;
console.log(
  alive
    ? `the client is still in play; capture in ${match.capture.dir}`
    : `the client left: ${match.disconnected ?? "it exited"}`,
);
await match.stop();
process.exit(alive ? 0 : 1);
