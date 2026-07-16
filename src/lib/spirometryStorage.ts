import { useEffect, useState } from "react"
import {
  SpirometryMetric,
  SpirometryResultSet,
} from "@/data/spirometryResults"

const STORAGE_KEY = "lung-function:spirometry-results"
const CHANGE_EVENT = "spirometry-results-changed"

export const SPIROMETRY_METRIC_NAMES = ["FVC", "FEV1", "FEV1 / FVC %"] as const

export type SpirometryMetricName = (typeof SPIROMETRY_METRIC_NAMES)[number]

export const METRIC_UNITS: Record<SpirometryMetricName, string> = {
  FVC: "L",
  FEV1: "L",
  "FEV1 / FVC %": "%",
}

export interface SpirometryMetricInput {
  name: SpirometryMetricName
  normal_range: string
  pred: number
  pre_meas: number
  post_meas: number
}

export function calculateFev1OverFvcRatio(fev1: number, fvc: number): number {
  if (fvc === 0) return 0
  return Math.round((fev1 / fvc) * 1000) / 10
}

export function calculatePrePercentPred(pred: number, pre_meas: number): number {
  if (pred === 0) return 0
  return Math.round((pre_meas / pred) * 100)
}

export function calculatePostPercentPred(pred: number, post_meas: number): number {
  if (pred === 0) return 0
  return Math.round((post_meas / pred) * 100)
}

export function calculatePercentChange(
  pre_meas: number,
  post_meas: number
): number {
  if (pre_meas === 0) return 0
  const value = ((post_meas - pre_meas) / pre_meas) * 100
  return Math.round(value * 10) / 10
}

function findMetric(
  metrics: SpirometryMetric[],
  name: string
): SpirometryMetric | undefined {
  return metrics.find((metric) => metric.name === name)
}

function hasVolumeSourceMetrics(metrics: SpirometryMetric[]): boolean {
  return Boolean(findMetric(metrics, "FEV1") && findMetric(metrics, "FVC"))
}

function resolveMetricInput(
  metrics: SpirometryMetric[],
  input: SpirometryMetricInput
): SpirometryMetricInput {
  if (input.name !== "FEV1 / FVC %") {
    return input
  }

  const fev1 = findMetric(metrics, "FEV1")
  const fvc = findMetric(metrics, "FVC")
  if (!fev1 || !fvc) {
    throw new Error(
      "FEV1 / FVC % 항목을 추가하려면 FVC와 FEV1이 먼저 등록되어야 합니다."
    )
  }

  return {
    ...input,
    pre_meas: calculateFev1OverFvcRatio(fev1.pre_meas, fvc.pre_meas),
    post_meas: calculateFev1OverFvcRatio(fev1.post_meas, fvc.post_meas),
  }
}

function enrichMetrics(metrics: SpirometryMetric[]): SpirometryMetric[] {
  const fev1 = findMetric(metrics, "FEV1")
  const fvc = findMetric(metrics, "FVC")

  return metrics.map((metric) => {
    let next = { ...metric }

    if (metric.name === "FEV1 / FVC %" && fev1 && fvc) {
      next = {
        ...next,
        pre_meas: calculateFev1OverFvcRatio(fev1.pre_meas, fvc.pre_meas),
        post_meas: calculateFev1OverFvcRatio(fev1.post_meas, fvc.post_meas),
      }
    }

    return enrichMetric(next)
  })
}

function enrichMetric(metric: SpirometryMetric): SpirometryMetric {
  return {
    ...metric,
    "pre % pred": calculatePrePercentPred(metric.pred, metric.pre_meas),
    "post % pred": calculatePostPercentPred(metric.pred, metric.post_meas),
    "% change": calculatePercentChange(metric.pre_meas, metric.post_meas),
  }
}

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function toMetric(input: SpirometryMetricInput): SpirometryMetric {
  return enrichMetric({
    name: input.name,
    unit: METRIC_UNITS[input.name],
    normal_range: input.normal_range,
    pred: input.pred,
    pre_meas: input.pre_meas,
    "pre % pred": 0,
    post_meas: input.post_meas,
    "post % pred": 0,
    "% change": 0,
  })
}

function fromMetric(metric: SpirometryMetric): SpirometryMetricInput {
  return {
    name: metric.name as SpirometryMetricName,
    normal_range: metric.normal_range,
    pred: metric.pred,
    pre_meas: metric.pre_meas,
    post_meas: metric.post_meas,
  }
}

export function loadSpirometryResults(): SpirometryResultSet[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as SpirometryResultSet[]
    return parsed.map((result) => ({
      ...result,
      metrics: enrichMetrics(result.metrics),
    }))
  } catch {
    return []
  }
}

export function saveSpirometryResults(data: SpirometryResultSet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  notifyChange()
}

export function getExamDates(): string[] {
  return loadSpirometryResults()
    .map((result) => result.examDate)
    .sort()
}

export function getSpirometryMetrics(examDate?: string): SpirometryMetric[] {
  const results = loadSpirometryResults()
  if (examDate) {
    const found = results.find((result) => result.examDate === examDate)
    return found ? found.metrics : []
  }
  return results.flatMap((result) => result.metrics)
}

export function addExamDate(examDate: string): void {
  const results = loadSpirometryResults()
  if (results.some((result) => result.examDate === examDate)) {
    throw new Error("이미 존재하는 검사일입니다.")
  }

  saveSpirometryResults([...results, { examDate, metrics: [] }])
}

export function deleteExamDate(examDate: string): void {
  saveSpirometryResults(
    loadSpirometryResults().filter((result) => result.examDate !== examDate)
  )
}

export function upsertMetric(
  examDate: string,
  input: SpirometryMetricInput
): void {
  const results = loadSpirometryResults()
  const index = results.findIndex((result) => result.examDate === examDate)
  if (index === -1) {
    throw new Error("검사일을 찾을 수 없습니다.")
  }

  const metrics = [...results[index].metrics]
  const existingIndex = metrics.findIndex((item) => item.name === input.name)
  const resolvedInput = resolveMetricInput(metrics, input)
  const metric = toMetric(resolvedInput)

  if (existingIndex >= 0) {
    metrics[existingIndex] = metric
  } else {
    metrics.push(metric)
  }

  const next = [...results]
  next[index] = {
    ...next[index],
    metrics: enrichMetrics(metrics),
  }
  saveSpirometryResults(next)
}

export function deleteMetric(examDate: string, metricName: string): void {
  const results = loadSpirometryResults()
  const index = results.findIndex((result) => result.examDate === examDate)
  if (index === -1) {
    return
  }

  const next = [...results]
  next[index] = {
    ...next[index],
    metrics: next[index].metrics.filter((metric) => metric.name !== metricName),
  }
  saveSpirometryResults(next)
}

export function metricToInput(metric: SpirometryMetric): SpirometryMetricInput {
  return fromMetric(metric)
}

export function createEmptyMetricInput(
  name: SpirometryMetricName = "FVC"
): SpirometryMetricInput {
  return {
    name,
    normal_range: "",
    pred: 0,
    pre_meas: 0,
    post_meas: 0,
  }
}

export function canAddRatioMetric(metrics: SpirometryMetric[]): boolean {
  return hasVolumeSourceMetrics(metrics)
}

export function isValidExamDate(value: string): boolean {
  return /^\d{8}$/.test(value)
}

export const SPIROMETRY_EXPORT_VERSION = 1

export interface SpirometryExportData {
  version: number
  exportedAt: string
  results: SpirometryResultSet[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeImportedMetric(metric: SpirometryMetric): SpirometryMetric {
  const name = metric.name as SpirometryMetricName
  if (!SPIROMETRY_METRIC_NAMES.includes(name)) {
    throw new Error(`지원하지 않는 항목입니다: ${metric.name}`)
  }

  return enrichMetric({
    name,
    unit: METRIC_UNITS[name],
    normal_range: String(metric.normal_range ?? ""),
    pred: Number(metric.pred) || 0,
    pre_meas: Number(metric.pre_meas) || 0,
    "pre % pred": 0,
    post_meas: Number(metric.post_meas) || 0,
    "post % pred": 0,
    "% change": 0,
  })
}

function normalizeImportedResultSet(result: SpirometryResultSet): SpirometryResultSet {
  if (!isValidExamDate(result.examDate)) {
    throw new Error(`올바르지 않은 검사일자입니다: ${result.examDate}`)
  }

  if (!Array.isArray(result.metrics)) {
    throw new Error(`검사일 ${result.examDate}의 metrics 형식이 올바르지 않습니다.`)
  }

  const metrics = result.metrics.map((metric) =>
    normalizeImportedMetric(metric as SpirometryMetric)
  )

  return {
    examDate: result.examDate,
    metrics: enrichMetrics(metrics),
  }
}

export function createSpirometryExportData(): SpirometryExportData {
  return {
    version: SPIROMETRY_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    results: loadSpirometryResults(),
  }
}

export function downloadSpirometryExport(): void {
  const payload = createSpirometryExportData()
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")

  anchor.href = url
  anchor.download = `lung-function-spirometry-${date}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function parseSpirometryImportData(raw: unknown): SpirometryResultSet[] {
  let results: unknown

  if (Array.isArray(raw)) {
    results = raw
  } else if (isRecord(raw) && Array.isArray(raw.results)) {
    results = raw.results
  } else {
    throw new Error("JSON 형식이 올바르지 않습니다.")
  }

  const parsed = results as SpirometryResultSet[]
  if (parsed.length === 0) {
    return []
  }

  const seenDates = new Set<string>()
  return parsed.map((result) => {
    const normalized = normalizeImportedResultSet(result)
    if (seenDates.has(normalized.examDate)) {
      throw new Error(`중복된 검사일이 있습니다: ${normalized.examDate}`)
    }
    seenDates.add(normalized.examDate)
    return normalized
  })
}

export function importSpirometryResults(raw: unknown): void {
  const results = parseSpirometryImportData(raw)
  saveSpirometryResults(results)
}

export function useSpirometryResults(): SpirometryResultSet[] {
  const [results, setResults] = useState<SpirometryResultSet[]>(() =>
    loadSpirometryResults()
  )

  useEffect(() => {
    const handler = () => setResults(loadSpirometryResults())
    window.addEventListener(CHANGE_EVENT, handler)
    return () => window.removeEventListener(CHANGE_EVENT, handler)
  }, [])

  return results
}
