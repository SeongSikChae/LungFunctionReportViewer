export interface SpirometryMetric {
  name: string
  unit: string
  normal_range: string
  pred: number
  pre_meas: number
  "pre % pred": number
  post_meas: number
  "post % pred": number
  "% change": number
}

export interface SpirometryResultSet {
  examDate: string
  metrics: SpirometryMetric[]
}

export { getSpirometryMetrics } from "@/lib/spirometryStorage"
