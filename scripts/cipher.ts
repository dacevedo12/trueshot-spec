// Blowfish in ECB mode with no padding, as schema/protocol.json records the
// cipher, from the runtime's own OpenSSL. The test suite holds it to every
// vector in conformance/vectors/cipher.

import { createCipheriv, createDecipheriv } from "node:crypto";
import type { Cipheriv as Cipher, Decipheriv as Decipher } from "node:crypto";

const BLOCK = 8;

// ECB takes no IV. Node wants none given; Bun refuses none and ignores the
// eight bytes it accepts instead.
function open<T extends Cipher | Decipher>(
  make: (algorithm: string, key: Uint8Array, iv: Uint8Array | null) => T,
  key: Uint8Array,
): T {
  try {
    return make("bf-ecb", key, null);
  } catch {
    return make("bf-ecb", key, new Uint8Array(BLOCK));
  }
}

class Blowfish {
  readonly #key: Uint8Array;

  constructor(key: Uint8Array) {
    this.#key = Uint8Array.from(key);
  }

  // Whole blocks are enciphered; a tail too short to fill one travels
  // unchanged.
  #run(input: Uint8Array, cipher: Cipher | Decipher): Uint8Array {
    cipher.setAutoPadding(false);
    const whole = input.length - (input.length % BLOCK);
    const out = new Uint8Array(input.length);
    out.set(cipher.update(input.subarray(0, whole)));
    out.set(cipher.final(), whole);
    out.set(input.subarray(whole), whole);
    return out;
  }

  encipher(plaintext: Uint8Array): Uint8Array {
    return this.#run(plaintext, open(createCipheriv, this.#key));
  }

  decipher(ciphertext: Uint8Array): Uint8Array {
    return this.#run(ciphertext, open(createDecipheriv, this.#key));
  }
}

export { BLOCK, Blowfish };
