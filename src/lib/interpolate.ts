export interface Point {
  x: number
  y: number
}

/**
 * Monotone cubic Hermite interpolation (Fritsch–Carlson).
 * Preserves monotonicity — suitable for volume-time curves that should not dip.
 */
export function interpolateMonotoneCubic(
  points: Point[],
  step = 0.1
): Point[] {
  if (points.length === 0) return []
  if (points.length === 1) return [{ ...points[0] }]

  const sorted = [...points].sort((a, b) => a.x - b.x)
  const n = sorted.length
  const xs = sorted.map((p) => p.x)
  const ys = sorted.map((p) => p.y)

  const dx: number[] = []
  const dy: number[] = []
  const slopes: number[] = []

  for (let i = 0; i < n - 1; i++) {
    dx[i] = xs[i + 1] - xs[i]
    dy[i] = ys[i + 1] - ys[i]
    slopes[i] = dy[i] / dx[i]
  }

  const tangents: number[] = new Array(n)
  tangents[0] = slopes[0]
  tangents[n - 1] = slopes[n - 2]

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0
    } else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      tangents[i] = (w1 + w2) / (w1 / slopes[i - 1] + w2 / slopes[i])
    }
  }

  const result: Point[] = []
  const xStart = xs[0]
  const xEnd = xs[n - 1]

  for (let x = xStart; x <= xEnd + 1e-9; x = roundTo(x + step, 6)) {
    const clampedX = Math.min(x, xEnd)
    result.push({ x: roundTo(clampedX, 2), y: roundTo(evalAt(clampedX), 4) })
    if (clampedX >= xEnd) break
  }

  // Ensure exact original keypoints are present
  for (const p of sorted) {
    const exists = result.some(
      (r) => Math.abs(r.x - p.x) < 1e-6 && Math.abs(r.y - p.y) < 1e-6
    )
    if (!exists) {
      result.push({ x: p.x, y: p.y })
    }
  }

  return result.sort((a, b) => a.x - b.x)

  function evalAt(x: number): number {
    let i = 0
    while (i < n - 2 && x > xs[i + 1]) i++

    const h = dx[i]
    const t = (x - xs[i]) / h
    const t2 = t * t
    const t3 = t2 * t

    const h00 = 2 * t3 - 3 * t2 + 1
    const h10 = t3 - 2 * t2 + t
    const h01 = -2 * t3 + 3 * t2
    const h11 = t3 - t2

    return h00 * ys[i] + h10 * h * tangents[i] + h01 * ys[i + 1] + h11 * h * tangents[i + 1]
  }
}

function roundTo(value: number, digits: number): number {
  const f = Math.pow(10, digits)
  return Math.round(value * f) / f
}
