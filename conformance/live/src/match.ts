// The least a server does to bring one client from connecting into play, as
// spec/joining.md orders it, plus the standing answers spec/ordering.md
// requires during play. A check adds what it is about on top.

import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { Capture, LOOKS } from "./capture.ts";
import { Client } from "./client.ts";
import type { Setup } from "./client.ts";
import { decodeFields, hex } from "../../../scripts/codec.ts";
import type { Values } from "../../../scripts/codec.ts";
import { Host } from "./enet.ts";
import type { Peer } from "./enet.ts";
import { decodeHeader } from "../../../scripts/message.ts";
import type { Message } from "../../../scripts/message.ts";
import { Layouts } from "../../../scripts/schema.ts";
import { Session } from "./session.ts";

// An arbitrary key. It is passed to the client at launch and means nothing.
const KEY = "17BLOhi6KZsTtldTsizvHg==";

interface Seat {
  readonly playerId: string;
  readonly clientId: number;
  readonly name: string;
  readonly champion: string;
  readonly skin: number;
  readonly netId: number;
}

// What the match sends to bring a client into play is owed whatever a check
// does, so a capture marks it as an answer and a replay leaves it out.
const ANSWER = { answer: true } as const;

const SEAT: Seat = {
  playerId: "1",
  clientId: 0,
  name: "Player",
  champion: "Annie",
  skin: 0,
  netId: 0x4000_0001,
};

type Stage =
  | "registered"
  | "versioned"
  | "seated"
  | "selected"
  | "spawned"
  | "ready"
  | "playing";

interface Options {
  readonly name: string;
  readonly seat?: Partial<Seat>;
  readonly map?: number;
  readonly versionSync?: Values;
  // Everything a check adds to the spawn run, between SpawnStart and SpawnEnd.
  readonly spawn?: (session: Session) => void;
  // What a check does once the client is in play.
  readonly play?: (session: Session) => void;
}

const versionNumber = (build: string): number => {
  const [a = "0", b = "0", c = "0", d = "0"] = build.split(".");
  return Number(
    `${a}${b.padStart(2, "0")}${c.padStart(2, "0")}${d.padStart(3, "0")}`,
  );
};

class Match {
  readonly layouts: Layouts;
  readonly capture: Capture;
  readonly seat: Seat;
  readonly client: Client;
  readonly #setup: Setup;
  readonly #options: Options;
  readonly #host: Host;
  readonly #reached = new Map<Stage, () => void>();
  readonly #stages = new Map<Stage, Promise<void>>();
  session: Session | undefined;
  disconnected: string | undefined;

  constructor(setup: Setup, options: Options) {
    this.#setup = setup;
    this.#options = options;
    this.layouts = new Layouts(setup.build);
    this.capture = new Capture(options.name);
    this.seat = { ...SEAT, ...options.seat };
    this.client = new Client(setup);
    for (const stage of [
      "registered",
      "versioned",
      "seated",
      "selected",
      "spawned",
      "ready",
      "playing",
    ] as const) {
      this.#stages.set(
        stage,
        new Promise((resolve) => this.#reached.set(stage, resolve)),
      );
    }
    this.#host = new Host(this.layouts, {
      connect: (peer) =>
        this.capture.note(`connected at a transmission unit of ${peer.mtu}`),
      receive: (peer, channel, payload) =>
        this.#receive(peer, channel, payload),
      datagram: (direction, bytes) => this.capture.datagram(direction, bytes),
      disconnect: (_peer, why) => {
        this.disconnected = why;
        this.session?.close(why);
        this.capture.note(`disconnected: ${why}`);
      },
    });
  }

  async start(): Promise<void> {
    await this.#host.listen(this.#setup.port);
    this.client.start(
      {
        host: "127.0.0.1",
        port: this.#setup.port,
        key: KEY,
        playerId: this.seat.playerId,
      },
      this.capture.dir,
    );
  }

  #reach(stage: Stage): void {
    this.capture.note(`stage: ${stage}`);
    this.#reached.get(stage)?.();
  }

  // Resolves once the client gets that far, and fails if it does not in time.
  async reach(stage: Stage, timeout = 180_000): Promise<void> {
    const reached = this.#stages.get(stage);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              `the client did not reach "${stage}" within ${timeout / 1000} s${this.disconnected === undefined ? "" : `: ${this.disconnected}`}`,
            ),
          ),
        timeout,
      );
    });
    try {
      await Promise.race([reached, late]);
    } finally {
      clearTimeout(timer);
    }
  }

  get alive(): boolean {
    return this.disconnected === undefined && this.client.running;
  }

  async screenshot(label: string): Promise<string | undefined> {
    const file = join(this.capture.dir, `${label}.png`);
    const failed = await this.client.screenshot(file);
    if (failed === "") return file;
    this.capture.note(`no screenshot ${label}: ${failed}`);
    return undefined;
  }

  // What only a person can judge: a screenshot and the sentence it should
  // bear out. `conform` lists each one in the results for review.
  async look(label: string, expect: string): Promise<void> {
    const file = await this.screenshot(label);
    appendFileSync(
      LOOKS,
      `${JSON.stringify({ label, expect, file: file ?? null })}\n`,
    );
  }

  async stop(): Promise<void> {
    await this.client.stop();
    this.#host.close();
  }

  #receive(peer: Peer, channel: number, payload: Uint8Array): void {
    if (this.session === undefined) {
      this.#register(peer, channel, payload);
      return;
    }
    this.session.receive(channel, payload);
  }

  // Register travels in the clear but for its proof, so it is read here before
  // a session with a cipher state exists (spec/transport.md, The key).
  #register(peer: Peer, channelId: number, payload: Uint8Array): void {
    const channel = this.layouts.channelById(channelId);
    if (channel?.name !== "registration") return;
    const key = Uint8Array.from(Buffer.from(KEY, "base64"));
    const session = new Session(
      this.layouts,
      this.#host,
      peer,
      key,
      this.capture,
    );
    const header = decodeHeader(this.layouts, channel, payload);
    const revision = this.layouts.message("Register");
    const context = {
      structs: this.layouts.structs,
      endian: this.layouts.protocol.endian,
      cipher: session.cipher,
    };
    const request = decodeFields(
      revision.fields,
      payload,
      header.offset,
      context,
    ).values;
    if (request["proof"] !== request["playerId"]) {
      this.capture.note(
        `refused: the proof deciphers to ${String(request["proof"])}, not ${String(request["playerId"])}`,
      );
      this.#host.disconnect(peer);
      return;
    }
    // The proof travels back as the bytes it arrived as.
    const proofAt = header.offset + 3 + 4 + 8 + 4;
    const proof = hex(payload.subarray(proofAt, proofAt + 8));
    this.session = session;
    session.enciphered = true;
    this.#answer(session);
    session.send(
      "Registered",
      {
        clientId: this.seat.clientId,
        playerId: this.seat.playerId,
        version: Number(
          request["version"] ?? versionNumber(this.layouts.build),
        ),
        proof,
      },
      ANSWER,
    );
    this.#reach("registered");
  }

  #answer(s: Session): void {
    const seat = this.seat;
    const terminated = (text: string): number =>
      Buffer.byteLength(text, "utf8") + 1;

    s.on("QueryStatus", () =>
      s.send("QueryStatusAnswer", { ready: 1 }, ANSWER),
    );

    s.on("ClientVersion", () => {
      const empty = { player: "-1", side: 0 };
      const seats = Array.from({ length: 12 }, (_, i) =>
        i === 0
          ? { player: seat.playerId, side: 100, level: 30, icon: 1 }
          : empty,
      );
      s.send(
        "VersionSync",
        {
          agreement: { buildMatches: 1 },
          map: this.#options.map ?? 1,
          seats,
          build: `Version ${this.layouts.build} [PUBLIC]`,
          mode: "CLASSIC",
          platform: "NA1",
          ...this.#options.versionSync,
        },
        ANSWER,
      );
      this.#reach("versioned");
    });

    s.on("JoinSide", () => {
      const side = Array.from({ length: 24 }, (_, i) =>
        i === 0 ? seat.playerId : "0",
      );
      const other = Array.from({ length: 24 }, () => "0");
      s.send(
        "Roster",
        {
          sideRoom: 6,
          otherSideRoom: 6,
          side,
          otherSide: other,
          sideTaken: 1,
          otherSideTaken: 0,
        },
        ANSWER,
      );
      s.send(
        "SeatName",
        {
          player: seat.playerId,
          nameLength: terminated(seat.name),
          name: seat.name,
          terminator: "00",
        },
        ANSWER,
      );
      s.send(
        "SeatChampion",
        {
          player: seat.playerId,
          skin: seat.skin,
          assetLength: terminated(seat.champion),
          asset: seat.champion,
          terminator: "00",
        },
        ANSWER,
      );
      this.#reach("seated");
    });

    s.on("LoadingProgress", (m: Message) => {
      const status = m.fields["status"] as Values | null;
      const state = m.fields["state"] as Values | null;
      s.send(
        "SeatLoadProgress",
        {
          clientId: seat.clientId,
          player: seat.playerId,
          progress: Number(m.fields["percent"] ?? 0),
          secondsLeft: Number(m.fields["eta"] ?? 0),
          count: Number(status?.["count"] ?? 0),
          ping: Number(status?.["ping"] ?? 0),
          state: { ready: Number(state?.["loaded"] ?? 0) },
        },
        ANSWER,
      );
    });

    s.on("CharacterSelected", () => {
      this.#reach("selected");
      s.send("SpawnStart", {}, ANSWER);
      s.send(
        "CreateChampion",
        {
          champion: seat.netId,
          clientId: seat.clientId,
          who: { side: 1 },
          name: seat.name,
          asset: seat.champion,
          skin: seat.skin,
        },
        ANSWER,
      );
      this.#options.spawn?.(s);
      s.send("SpawnEnd", {}, ANSWER);
      this.#reach("spawned");
    });

    s.on("ClientReady", () => {
      this.#reach("ready");
      s.send("StartGame", {}, ANSWER);
      s.send("ClockSync", { elapsed: 0 }, ANSWER);
      s.send("MatchStarted", { startedAt: 0 }, ANSWER);
      this.#reach("playing");
      this.#options.play?.(s);
    });

    s.on("Camera", (m: Message) =>
      s.send("CameraAck", { syncId: Number(m.fields["syncId"] ?? 0) }, ANSWER),
    );
  }
}

export { KEY, Match, SEAT };
export type { Options, Seat, Stage };
