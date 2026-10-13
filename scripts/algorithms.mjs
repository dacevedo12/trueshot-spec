// What a layout cannot say. Each function here takes fields a decoder has
// already read and produces what they mean, so it never sees a byte and can
// never stand in for a layout.

class AlgorithmError extends Error {
  constructor(message) {
    super(message);
    this.name = "AlgorithmError";
  }
}

// A path states every point after the first as either a step from the point
// before it or a coordinate afresh, one choice per axis. Resolving one means
// adding a step to the point as it resolved, not to what the wire carried.
const resolvePath = ({ firstX, firstZ, steps }) => {
  let x = firstX;
  let z = firstZ;
  const points = [{ x, z }];
  for (const step of steps ?? []) {
    x = step.xStep === null ? step.xWhole : x + step.xStep;
    z = step.zStep === null ? step.zWhole : z + step.zStep;
    points.push({ x, z });
  }
  return points;
};

// A spell, an effect, a particle or a place on a unit is named by a number
// worked out from its name: the ELF hash of the name with A to Z lowered.
const nameHash = (name) => {
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

const ALGORITHMS = { resolvePath, nameHash };

export { ALGORITHMS, AlgorithmError };
