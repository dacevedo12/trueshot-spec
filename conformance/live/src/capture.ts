// What a run saw, one JSON line per event, under captures/ (never committed).
// A capture is what `replay` re-sends, so it holds every server payload by
// name and fields as well as by bytes.

import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { hex } from "./codec.ts";
import type { Value } from "./codec.ts";

const CAPTURES = join(import.meta.dir, "..", "captures");
const LOOKS = join(CAPTURES, "looks.jsonl");

type Entry =
  | {
      readonly at: number;
      readonly kind: "message";
      readonly direction: "in" | "out";
      readonly channel: string;
      readonly name: string;
      readonly fields: Value;
      readonly bytes: string;
      readonly answer?: true;
    }
  | {
      readonly at: number;
      readonly kind: "unread";
      readonly channel: string;
      readonly bytes: string;
      readonly why: string;
    }
  | { readonly at: number; readonly kind: "note"; readonly text: string };

class Capture {
  readonly dir: string;
  readonly #file: string;
  readonly #start = Date.now();

  constructor(name: string) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.dir = join(CAPTURES, `${stamp}-${name}`);
    mkdirSync(this.dir, { recursive: true });
    this.#file = join(this.dir, "events.jsonl");
  }

  #write(entry: Entry): void {
    appendFileSync(this.#file, `${JSON.stringify(entry)}\n`);
  }

  get #at(): number {
    return Date.now() - this.#start;
  }

  // An answer is what a server owes whatever happens, which a replay leaves
  // to the match it runs in rather than re-sending.
  message(
    direction: "in" | "out",
    channel: string,
    name: string,
    fields: Value,
    bytes: Uint8Array,
    answer = false,
  ): void {
    this.#write({
      at: this.#at,
      kind: "message",
      direction,
      channel,
      name,
      fields,
      bytes: hex(bytes),
      ...(answer ? { answer: true as const } : {}),
    });
  }

  unread(channel: string, bytes: Uint8Array, why: string): void {
    this.#write({
      at: this.#at,
      kind: "unread",
      channel,
      bytes: hex(bytes),
      why,
    });
  }

  // Every datagram both ways, byte for byte, beside the events.
  datagram(direction: "in" | "out", bytes: Uint8Array): void {
    appendFileSync(
      join(this.dir, "datagrams.jsonl"),
      `${JSON.stringify({ at: this.#at, direction, bytes: hex(bytes) })}\n`,
    );
  }

  note(text: string): void {
    this.#write({ at: this.#at, kind: "note", text });
  }
}

export { CAPTURES, Capture, LOOKS };
export type { Entry };
