import { SpirometryMetric, SpirometryResultSet } from "@/data/spirometryResults"
import { Point } from "@/lib/interpolate"
import {
  densifyVolumeTimeSeries,
  VolumeTimeSeries,
} from "@/data/volumeTime"

function findMetric(
  metrics: SpirometryMetric[],
  name: string
): SpirometryMetric | undefined {
  return metrics.find((metric) => metric.name === name)
}

function parseNormalRange(
  range: string
): { low: number; high: number } | null {
  const [lowText, highText] = range.split("-")
  const low = Number(lowText)
  const high = Number(highText)
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return null
  }
  return { low, high }
}

function buildCurve(fev1: number, fvc: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: 1, y: fev1 },
    { x: 6, y: fvc },
  ]
}

function hasVolumeMetrics(metrics: SpirometryMetric[]): boolean {
  return Boolean(findMetric(metrics, "FEV1") && findMetric(metrics, "FVC"))
}

function buildMeasuredSeries(
  result: SpirometryResultSet,
  valueKey: "pre_meas" | "post_meas"
): VolumeTimeSeries | null {
  const fev1 = findMetric(result.metrics, "FEV1")
  const fvc = findMetric(result.metrics, "FVC")
  if (!fev1 || !fvc) {
    return null
  }

  return {
    series: result.examDate,
    datas: buildCurve(fev1[valueKey], fvc[valueKey]),
  }
}

function buildReferenceSeries(
  result: SpirometryResultSet,
  suffix: "LOW" | "PRED" | "HIGH"
): VolumeTimeSeries | null {
  const fev1 = findMetric(result.metrics, "FEV1")
  const fvc = findMetric(result.metrics, "FVC")
  if (!fev1 || !fvc) {
    return null
  }

  let fev1Value = 0
  let fvcValue = 0

  if (suffix === "PRED") {
    fev1Value = fev1.pred
    fvcValue = fvc.pred
  } else {
    const fev1Range = parseNormalRange(fev1.normal_range)
    const fvcRange = parseNormalRange(fvc.normal_range)
    if (!fev1Range || !fvcRange) {
      return null
    }
    fev1Value = suffix === "LOW" ? fev1Range.low : fev1Range.high
    fvcValue = suffix === "LOW" ? fvcRange.low : fvcRange.high
  }

  return {
    series: `${result.examDate}_${suffix}`,
    datas: buildCurve(fev1Value, fvcValue),
  }
}

export function buildPreBdVolumeTimeSeries(
  results: SpirometryResultSet[]
): VolumeTimeSeries[] {
  const raw = results
    .filter((result) => hasVolumeMetrics(result.metrics))
    .map((result) => buildMeasuredSeries(result, "pre_meas"))
    .filter((series): series is VolumeTimeSeries => series !== null)

  return densifyVolumeTimeSeries(raw)
}

export function buildPostBdVolumeTimeSeries(
  results: SpirometryResultSet[]
): VolumeTimeSeries[] {
  const raw = results
    .filter((result) => hasVolumeMetrics(result.metrics))
    .map((result) => buildMeasuredSeries(result, "post_meas"))
    .filter((series): series is VolumeTimeSeries => series !== null)

  return densifyVolumeTimeSeries(raw)
}

export function buildMergedVolumeTimeSeries(
  results: SpirometryResultSet[]
): VolumeTimeSeries[] {
  const raw: VolumeTimeSeries[] = []

  results
    .filter((result) => hasVolumeMetrics(result.metrics))
    .forEach((result) => {
      const pre = buildMeasuredSeries(result, "pre_meas")
      const post = buildMeasuredSeries(result, "post_meas")
      const low = buildReferenceSeries(result, "LOW")
      const pred = buildReferenceSeries(result, "PRED")
      const high = buildReferenceSeries(result, "HIGH")

      if (pre) {
        raw.push({ ...pre, series: `${result.examDate}_PRE` })
      }
      if (post) {
        raw.push({ ...post, series: `${result.examDate}_POST` })
      }
      if (low) raw.push(low)
      if (pred) raw.push(pred)
      if (high) raw.push(high)
    })

  return densifyVolumeTimeSeries(raw)
}
