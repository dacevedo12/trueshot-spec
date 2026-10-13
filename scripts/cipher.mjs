// The cipher the specification records, used to check the cipher vectors
// against something other than their own say-so. This is the stock library
// implementation the specification tells an implementer to reach for, not a
// second implementation of Blowfish.
import { createCipheriv, createDecipheriv } from "node:crypto";

const BLOCK = 8;

class CipherError extends Error {
  constructor(message) {
    super(message);
    this.name = "CipherError";
  }
}

// OpenSSL 3.0 keeps Blowfish in a legacy provider that stays off unless
// something turns it on. Say so, because the error it raises otherwise reads
// as though the algorithm does not exist.
const unsupported = (error) =>
  new CipherError(
    `Blowfish is unavailable: ${error.code ?? error.message}. ` +
      "Run node with --openssl-legacy-provider, which is what the specification " +
      "tells an implementer to enable.",
  );

// There is no padding, so a tail too short to fill a block travels unchanged.
const split = (buffer) => {
  const whole = buffer.length - (buffer.length % BLOCK);
  return [buffer.subarray(0, whole), buffer.subarray(whole)];
};

const run = (make, key, input) => {
  const [blocks, tail] = split(input);
  let cipher;
  try {
    cipher = make("bf-ecb", key, null);
  } catch (error) {
    throw unsupported(error);
  }
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(blocks), cipher.final(), tail]);
};

const encipher = (key, plaintext) => run(createCipheriv, key, plaintext);
const decipher = (key, ciphertext) => run(createDecipheriv, key, ciphertext);

export { BLOCK, CipherError, decipher, encipher };
