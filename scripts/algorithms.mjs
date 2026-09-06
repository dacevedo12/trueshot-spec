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

const ALGORITHMS = { resolvePath };

export { ALGORITHMS, AlgorithmError };
