/** Time-weighted native scroll velocity over the latest 200 ms of movement. */
export function createScrollSpeed() {
  let samples: { delta: number; start: number; end: number }[] = [];
  return {
    clear() {
      samples = [];
    },
    record(delta: number, start: number, end: number) {
      if (!Number.isFinite(delta) || !delta || end <= start) return 0;
      // A deliberate reversal should take effect immediately, without old momentum.
      if (
        samples.length &&
        Math.sign(samples.at(-1)!.delta) !== Math.sign(delta)
      )
        samples = [];
      const cutoff = end - 200;
      samples.push({ delta, start, end });
      samples = samples.filter((sample) => sample.end > cutoff);
      let distance = 0,
        duration = 0;
      for (const sample of samples) {
        const overlap = sample.end - Math.max(sample.start, cutoff);
        distance += (sample.delta * overlap) / (sample.end - sample.start);
        duration += overlap;
      }
      return duration ? distance / duration : 0;
    },
  };
}

/** Boost sluggish continuation to one second; faster native movement stays unchanged. */
export function continuationDuration(distance: number, velocity: number) {
  const duration = Math.abs(distance / velocity);
  return duration >= 3000 ? 1000 : duration;
}
