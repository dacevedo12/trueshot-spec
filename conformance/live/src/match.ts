// The least a server does to bring one client from connecting into play, as
// spec/joining.md orders it, plus the standing answers spec/ordering.md
// requires during play. A check adds what it is about on top.

import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { Capture, LOOKS } from "./capture.ts";
import { Client, layoutsOf } from "./client.ts";
import type { Setup } from "./client.ts";
import { decodeFields, hex, isRecord } from "../../../scripts/codec.ts";
import type { Values } from "../../../scripts/codec.ts";
import { Host } from "./enet.ts";
import type { Peer } from "./enet.ts";
import { decodeHeader } from "../../../scripts/message.ts";
import type { Message } from "../../../scripts/message.ts";
import { Layouts } from "../../../scripts/schema.ts";
import { Session } from "./session.ts";

// An arbitrary key. It is passed to the client at launch and means nothing.
const KEY = "CokZRbAN15lr+Vviv9YYow==";

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

// How long a client gets from launch to its registration.
const REGISTER_WITHIN = 150_000;

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
  // False to serve a client started some other way, and to leave it be.
  readonly launch?: boolean;
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
    this.layouts = layoutsOf(setup);
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
        this.#giveUp(why);
        this.session?.close(why);
        this.capture.note(`disconnected: ${why}`);
      },
    });
  }

  async start(): Promise<void> {
    await this.#host.listen(this.#setup.port);
    if (this.#options.launch === false) return;
    this.client.start(
      {
        host: "127.0.0.1",
        port: this.#setup.port,
        key: KEY,
        playerId: this.seat.playerId,
      },
      this.capture.dir,
    );
    // A client that never registers, or exits, ends the match there.
    const started = Date.now();
    let looking = false;
    const watch = setInterval(() => {
      if (!looking && this.#stopped === undefined) {
        looking = true;
        void this.#lookForDialogs().finally(() => {
          looking = false;
        });
      }
      if (this.#stopped !== undefined) clearInterval(watch);
      else if (!this.client.running) this.#giveUp("the client exited");
      else if (
        this.session === undefined &&
        Date.now() - started > REGISTER_WITHIN
      ) {
        this.#giveUp(
          `the client did not register within ${REGISTER_WITHIN / 1000} s`,
        );
      }
    }, 1_000);
    this.#watch = watch;
  }

  #watch: ReturnType<typeof setInterval> | undefined;
  readonly #dialogs = new Set<string>();

  // A window besides the one the client plays in is an error the client
  // shows, or its crash report, and the client goes no further past one.
  async #lookForDialogs(): Promise<void> {
    for (const w of await this.client.dialogs()) {
      if (this.#dialogs.has(w.id)) continue;
      this.#dialogs.add(w.id);
      const file = join(this.capture.dir, `dialog-${this.#dialogs.size}.png`);
      const failed = await this.client.screenshot(file, w.id);
      this.capture.note(
        `the client showed a window titled "${w.title}"${failed === "" ? `, captured in ${file}` : ""}`,
      );
      this.#giveUp(`the client showed a window titled "${w.title}"`);
    }
  }

  readonly #reachedStages = new Set<Stage>();

  #reach(stage: Stage): void {
    this.#reachedStages.add(stage);
    this.capture.note(`stage: ${stage}`);
    this.#reached.get(stage)?.();
  }

  // Resolves once the client gets that far, and fails if it does not in time.
  // Why the match can go no further: the connection dropped, the client
  // exited, or it never registered. Every later stage fails at once with it.
  #stopped: string | undefined;
  readonly #stop = new Set<(why: string) => void>();

  #giveUp(why: string): void {
    if (this.#stopped !== undefined) return;
    this.#stopped = why;
    this.capture.note(`gave up: ${why}`);
    for (const f of this.#stop) f(why);
  }

  async reach(stage: Stage, timeout = 180_000): Promise<void> {
    const reached = this.#stages.get(stage);
    const stopped = this.#stopped;
    if (stopped !== undefined && this.#reachedStages.has(stage) === false) {
      throw new Error(`the client did not reach "${stage}": ${stopped}`);
    }
    let onStop: ((why: string) => void) | undefined;
    const gone = new Promise<never>((_, reject) => {
      onStop = (why) =>
        reject(new Error(`the client did not reach "${stage}": ${why}`));
      this.#stop.add(onStop);
    });
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
      await Promise.race([reached, late, gone]);
    } finally {
      clearTimeout(timer);
      if (onStop !== undefined) this.#stop.delete(onStop);
    }
  }

  get alive(): boolean {
    return this.#stopped === undefined && this.client.running;
  }

  // Why the match went no further, where it did not.
  get stopped(): string | undefined {
    return this.#stopped;
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
    if (this.#watch !== undefined) clearInterval(this.#watch);
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
    this.capture.message(
      "in",
      channel.name,
      "Register",
      { ...header.values, ...request },
      payload,
    );
    if (request["proof"] !== request["playerId"]) {
      this.capture.note(
        `refused: the proof deciphers to ${String(request["proof"])}, not ${String(request["playerId"])}`,
      );
      this.#host.disconnect(peer);
      return;
    }
    // The proof travels back as the bytes it arrived as.
    // The proof travels back as the bytes it arrived as, wherever the
    // build's layout puts it.
    const before = revision.fields.slice(
      0,
      revision.fields.findIndex((f) => f.name === "proof"),
    );
    const proofAt = decodeFields(
      before,
      payload,
      header.offset,
      context,
    ).offset;
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
          request["version"] ?? versionNumber(this.#setup.build),
        ),
        proof,
      },
      ANSWER,
    );
    this.#reach("registered");
  }

  // A field that is a flag in one build's layout and a run of bits holding
  // the flag in another's.
  #flag(field: string, message: string, run: string): Values[string] {
    const f = this.layouts
      .message(message)
      .fields.find((x) => x.name === field);
    return f?.type === "bits" ? { [run]: 1 } : 1;
  }

  #answer(s: Session): void {
    const walkOf = (movement: Values[string] | undefined): Values => {
      const path = isRecord(movement) ? movement : {};
      const header = isRecord(path["header"]) ? path["header"] : {};
      return { ...path, header: { ...header, hasTeleportToken: 0 } };
    };
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
          // A run of bits in some builds, a plain value of 1 in others.
          agreement: this.#flag("agreement", "VersionSync", "buildMatches"),
          map: this.#options.map ?? 1,
          seats,
          build: `Version ${this.#setup.build} [PUBLIC]`,
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
          status: {
            count: Number(status?.["count"] ?? 0),
            ping: Number(status?.["ping"] ?? 0),
          },
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
          side: 1,
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

    // A champion ordered somewhere walks the path its client worked out
    // (spec/movement.md), numbered above anything a check sends.
    if (
      this.layouts.messages.has("MoveOrder") &&
      this.layouts.messages.has("WaypointGroup")
    ) {
      let syncId = 1_000;
      s.on("MoveOrder", (m: Message) => {
        syncId += 1;
        s.send(
          "WaypointGroup",
          {
            syncId,
            movementCount: 1,
            // The order's path, with no teleport token: a client sends none.
            movements: [walkOf(m.fields["movement"])],
          },
          ANSWER,
        );
      });
    }

    s.on("Camera", (m: Message) =>
      s.send("CameraAck", { syncId: Number(m.fields["syncId"] ?? 0) }, ANSWER),
    );
  }
}

export { KEY, Match, SEAT };
export type { Options, Seat, Stage };
