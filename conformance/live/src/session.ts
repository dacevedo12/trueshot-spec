// One client's connection, carried by the host: the cipher state, payloads as
// named messages, and a record of everything that passed.

import { Blowfish } from "../../../scripts/cipher.ts";
import type { Values } from "../../../scripts/codec.ts";
import type { Capture } from "./capture.ts";
import type { Delivery, Host, Peer } from "./enet.ts";
import {
  compose,
  decodeMessage,
  encodeMessage,
} from "../../../scripts/message.ts";
import type { Message } from "../../../scripts/message.ts";
import type { Layouts } from "../../../scripts/schema.ts";

interface Waiter {
  readonly name: string;
  readonly test: (m: Message) => boolean;
  readonly resolve: (m: Message) => void;
}

class Session {
  readonly layouts: Layouts;
  readonly cipher: Blowfish;
  readonly peer: Peer;
  readonly #host: Host;
  readonly #capture: Capture;
  readonly #handlers = new Map<string, ((m: Message) => void)[]>();
  readonly #waiters: Waiter[] = [];
  readonly received: Message[] = [];
  enciphered = false;
  closed: string | undefined;

  constructor(
    layouts: Layouts,
    host: Host,
    peer: Peer,
    key: Uint8Array,
    capture: Capture,
  ) {
    this.layouts = layouts;
    this.#host = host;
    this.peer = peer;
    this.cipher = new Blowfish(key);
    this.#capture = capture;
  }

  // Every answer a server owes from here on goes through `on`.
  on(name: string, handler: (m: Message) => void): void {
    this.layouts.message(name);
    const list = this.#handlers.get(name) ?? [];
    list.push(handler);
    this.#handlers.set(name, list);
  }

  // The next message of that name, or the first one already received that
  // passes the test where `since` reaches back.
  next(
    name: string,
    options: {
      timeout?: number;
      test?: (m: Message) => boolean;
      seen?: boolean;
    } = {},
  ): Promise<Message> {
    const test = options.test ?? (() => true);
    if (options.seen === true) {
      const found = this.received.find((m) => m.name === name && test(m));
      if (found !== undefined) return Promise.resolve(found);
    }
    const timeout = options.timeout ?? 60_000;
    return new Promise((resolve, reject) => {
      const waiter: Waiter = { name, test, resolve };
      this.#waiters.push(waiter);
      setTimeout(() => {
        const at = this.#waiters.indexOf(waiter);
        if (at === -1) return;
        this.#waiters.splice(at, 1);
        reject(
          new Error(
            `no ${name} within ${timeout / 1000} s${this.closed === undefined ? "" : `: ${this.closed}`}`,
          ),
        );
      }, timeout);
    });
  }

  send(
    name: string,
    fields: Values = {},
    options: { channel?: string; answer?: boolean } = {},
  ): void {
    // A range the specification defines no revision of this message for
    // gets nothing; the capture says so.
    if (!this.layouts.messages.has(name)) {
      this.#capture.note(
        `not sent: ${name} has no revision for ${this.layouts.build}`,
      );
      return;
    }
    if (this.closed !== undefined) return;
    const revision = this.layouts.message(name);
    const channelName = options.channel ?? revision.channel;
    const delivery: Delivery =
      channelName === revision.channel
        ? revision.reliability
        : (revision.alsoOn?.find((a) => a.channel === channelName)
            ?.reliability ?? revision.reliability);
    const full = compose(this.layouts, name, fields);
    const clear = encodeMessage(this.layouts, name, full);
    this.#capture.message(
      "out",
      channelName,
      name,
      full,
      clear,
      options.answer === true,
    );
    this.#host.send(
      this.peer,
      this.layouts.channel(channelName).id,
      this.enciphered ? this.cipher.encipher(clear) : clear,
      delivery,
    );
  }

  receive(channelId: number, payload: Uint8Array): void {
    const channel = this.layouts.channelById(channelId);
    if (channel === undefined) {
      this.#capture.note(
        `a payload on channel ${channelId}, which ${this.layouts.build} does not define`,
      );
      return;
    }
    // Only the registration request travels before a cipher state exists.
    const clear = this.enciphered ? this.cipher.decipher(payload) : payload;
    let message: Message;
    try {
      message = decodeMessage(this.layouts, channel, clear, true, this.cipher);
    } catch (error) {
      this.#capture.unread(channel.name, clear, String(error));
      return;
    }
    this.#capture.message(
      "in",
      channel.name,
      message.name,
      message.fields,
      clear,
    );
    this.received.push(message);
    for (const handler of this.#handlers.get(message.name) ?? [])
      handler(message);
    for (const waiter of [...this.#waiters]) {
      if (waiter.name === message.name && waiter.test(message)) {
        this.#waiters.splice(this.#waiters.indexOf(waiter), 1);
        waiter.resolve(message);
      }
    }
  }

  close(why: string): void {
    this.closed ??= why;
  }
}

export { Session };
