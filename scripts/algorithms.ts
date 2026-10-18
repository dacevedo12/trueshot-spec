// What a layout cannot say. Each function here takes fields a decoder has
// already read and produces what they mean, so it never sees a byte and can
// never stand in for a layout.

import type { Value } from "./codec.ts";

class AlgorithmError extends Error {
  override readonly name = "AlgorithmError";
}

type Algorithm = (input: Value) => Value;

const field = (input: Value, name: string): Value => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new AlgorithmError(`expects an object holding "${name}"`);
  }
  return (input as { readonly [key: string]: Value })[name] ?? null;
};

const number = (input: Value, name: string): number => {
  const value = field(input, name);
  if (typeof value !== "number") {
    throw new AlgorithmError(`expects "${name}" to be a number`);
  }
  return value;
};

// A path states every point after the first as either a step from the point
// before it or a coordinate afresh, one choice per axis. Resolving one means
// adding a step to the point as it resolved, not to what the wire carried.
const resolvePath: Algorithm = (input) => {
  let x = number(input, "firstX");
  let z = number(input, "firstZ");
  const points: Value[] = [{ x, z }];
  const steps = field(input, "steps");
  for (const step of Array.isArray(steps) ? (steps as readonly Value[]) : []) {
    x =
      field(step, "xStep") === null
        ? number(step, "xWhole")
        : x + number(step, "xStep");
    z =
      field(step, "zStep") === null
        ? number(step, "zWhole")
        : z + number(step, "zStep");
    points.push({ x, z });
  }
  return points;
};

// A spell, an effect, a particle or a place on a unit is named by a number
// worked out from its name: the ELF hash of the name with A to Z lowered.
const nameHash: Algorithm = (name) => {
  if (typeof name !== "string") {
    throw new AlgorithmError("expects a name");
  }
  let number = 0;
  for (const byte of Buffer.from(
    name.replace(/[A-Z]/g, (c) => c.toLowerCase()),
    "latin1",
  )) {
    number = ((number << 4) + byte) >>> 0;
    const high = number & 0xf0000000;
    if (high !== 0) number = (number ^ (high >>> 24)) >>> 0;
    number = (number & ~high) >>> 0;
  }
  return number;
};

const ALGORITHMS: Readonly<Record<string, Algorithm>> = {
  resolvePath,
  nameHash,
};

export { ALGORITHMS, AlgorithmError };
export type { Algorithm };
