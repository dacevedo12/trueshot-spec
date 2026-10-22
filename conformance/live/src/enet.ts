// The transport: ENet 1.2.5 through enet-js, built with the changes
// native/enet-1.2.5.patch makes (native/build.sh). A relay on the port the
// client connects to passes every datagram on to the ENet host and records it
// on the way, so a capture holds the transport byte for byte.

import type { udp } from "bun";
import type { IENetHost, IENetPeer } from "enet-js";
import { join } from "node:path";
import type { Layouts } from "../../../scripts/schema.ts";

type Delivery = "reliable" | "unreliable" | "unsequenced";

interface Events {
  connect(peer: Peer): void;
  receive(peer: Peer, channel: number, payload: Uint8Array): void;
  disconnect(peer: Peer, why: string): void;
  datagram?(direction: "in" | "out", bytes: Uint8Array): void;
}

class Peer {
  readonly native: IENetPeer;
  readonly mtu: number;

  constructor(native: IENetPeer) {
    this.native = native;
    this.mtu = native.mtu;
  }
}

type Enet = typeof import("enet-js");

// The library whose header matches the build's, as schema/protocol.json lays
// it out: the release's own, whose session id fills four bytes and whose peer
// id fills two, taking datagrams up to the release's largest or to 996 bytes;
// the one-byte form; or that form after four bytes more.
function library(layouts: Layouts): string {
  const transport = layouts.protocol.transport;
  const header = transport.header;
  const small = transport.constants.some(
    (c) => c.name === "maximumTransmissionUnit" && c.value === 996,
  );
  const kind = header.some((f) => f.name === "addressCheck")
    ? "address-check"
    : header.some(
          (f) => f.name === "peer" && f.type === "bits" && f.size === 2,
        )
      ? small
        ? "stock-small"
        : "stock"
      : "plain";
  const variable = {
    "address-check": "TRUESHOT_ENET_ADDRESS_CHECK",
    stock: "TRUESHOT_ENET_STOCK",
    "stock-small": "TRUESHOT_ENET_STOCK_SMALL",
    plain: "TRUESHOT_ENET_PLAIN",
  }[kind];
  const named = Bun.env[variable];
  if (named !== undefined && named !== "") return named;
  const extension =
    process.platform === "darwin"
      ? "dylib"
      : process.platform === "win32"
        ? "dll"
        : "so";
  const name = `libenet-${kind}`;
  return join(
    import.meta.dir,
    "..",
    "native",
    "build",
    `${name}.${extension}`,
  );
}

// enet-js reads the library's path once, when it is first imported, so a
// process serves one header layout.
let loaded: { readonly path: string; readonly enet: Enet } | undefined;

async function load(path: string): Promise<Enet> {
  if (loaded !== undefined) {
    if (loaded.path !== path) {
      throw new Error(
        `ENet is already loaded from ${loaded.path}; run each build in a process of its own`,
      );
    }
    return loaded.enet;
  }
  if (!(await Bun.file(path).exists())) {
    throw new Error(
      `no ENet library at ${path}; run native/build.sh, or name one in the environment`,
    );
  }
  process.env["ENET_LIB_PATH"] = path;
  const enet = await import("enet-js");
  if (enet.enet.initialize() !== 0)
    throw new Error("ENet failed to initialize");
  loaded = { path, enet };
  return enet;
}

// The ENet host listens this far above the port the client is given.
const BEHIND = 100;

class Host {
  readonly #layouts: Layouts;
  readonly #events: Events;
  #enet: Enet | undefined;
  #host: IENetHost | undefined;
  #peer: Peer | undefined;
  #front: udp.Socket<"uint8array"> | undefined;
  #back: udp.Socket<"uint8array"> | undefined;
  #client: { address: string; port: number } | undefined;
  #timer: ReturnType<typeof setInterval> | undefined;

  constructor(layouts: Layouts, events: Events) {
    this.#layouts = layouts;
    this.#events = events;
  }

  async listen(port: number): Promise<void> {
    const enet = await load(library(this.#layouts));
    this.#enet = enet;
    const host = enet.enet.host.create(
      { host: "127.0.0.1", port: port + BEHIND },
      1,
      0,
      0,
    );
    if (host === null) {
      throw new Error(`ENet could not listen on port ${port + BEHIND}`);
    }
    this.#host = host;

    this.#back = await Bun.udpSocket({
      hostname: "127.0.0.1",
      binaryType: "uint8array",
      socket: {
        data: (_socket, data) => {
          this.#events.datagram?.("out", data);
          const client = this.#client;
          if (client !== undefined) {
            this.#front?.send(data, client.port, client.address);
          }
        },
      },
    });
    this.#front = await Bun.udpSocket({
      hostname: "127.0.0.1",
      port,
      binaryType: "uint8array",
      socket: {
        data: (_socket, data, fromPort, fromAddress) => {
          this.#client = { address: fromAddress, port: fromPort };
          this.#events.datagram?.("in", data);
          this.#back?.send(data, port + BEHIND, "127.0.0.1");
        },
      },
    });
    this.#timer = setInterval(() => this.#service(), 1);
  }

  #service(): void {
    const enet = this.#enet;
    const host = this.#host;
    if (enet === undefined || host === undefined) return;
    const { ENetEventType } = enet;
    for (let i = 0; i < 64; i += 1) {
      const event = enet.enet.host.service(host, 0);
      if (event.type === ENetEventType.none) return;
      if (event.type === ENetEventType.connect) {
        this.#peer = new Peer(event.peer);
        this.#events.connect(this.#peer);
      } else if (event.type === ENetEventType.disconnect) {
        const peer = this.#peer ?? new Peer(event.peer);
        this.#peer = undefined;
        this.#events.disconnect(peer, "the client disconnected or went quiet");
      } else if (event.type === ENetEventType.receive) {
        const payload = Uint8Array.from(event.packet.data);
        enet.enet.packet.destroy(event.packet);
        const peer = this.#peer ?? new Peer(event.peer);
        this.#events.receive(peer, event.channelID, payload);
      }
    }
  }

  send(
    peer: Peer,
    channel: number,
    payload: Uint8Array,
    delivery: Delivery,
  ): void {
    const enet = this.#enet;
    if (enet === undefined) return;
    const { ENetPacketFlag } = enet;
    const flags =
      delivery === "reliable"
        ? ENetPacketFlag.reliable
        : delivery === "unsequenced"
          ? ENetPacketFlag.unsequenced
          : ENetPacketFlag.none;
    const packet = enet.enet.packet.create(Buffer.from(payload), flags);
    if (packet === null) throw new Error("ENet could not make a packet");
    enet.enet.peer.send(peer.native, channel, packet);
  }

  disconnect(peer: Peer): void {
    this.#enet?.enet.peer.disconnect(peer.native, 0);
  }

  close(): void {
    if (this.#timer !== undefined) clearInterval(this.#timer);
    const enet = this.#enet;
    const host = this.#host;
    if (enet !== undefined && host !== undefined) {
      if (this.#peer !== undefined) {
        enet.enet.peer.disconnectNow(this.#peer.native, 0);
      }
      enet.enet.host.flush(host);
      enet.enet.host.destroy(host);
    }
    this.#host = undefined;
    this.#front?.close();
    this.#back?.close();
  }
}

export { Host, Peer };
export type { Delivery, Events };
