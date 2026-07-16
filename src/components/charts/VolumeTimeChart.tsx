import React from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { VolumeTimeSeries } from "@/data/volumeTime"

interface ChartRow {
  time: number
  [series: string]: number
}

interface RangeBand {
  base: string
  lowKey: string
  highKey: string
  rangeBaseKey: string
  bandKey: string
  label: string
}

function toChartRows(seriesList: VolumeTimeSeries[]): ChartRow[] {
  if (seriesList.length === 0) return []

  const timeSet = new Set<number>()
  seriesList.forEach((s) => s.datas.forEach((p) => timeSet.add(p.x)))
  const times = Array.from(timeSet).sort((a, b) => a - b)

  return times.map((time) => {
    const row: ChartRow = { time }
    seriesList.forEach((s) => {
      const point = s.datas.find((p) => Math.abs(p.x - time) < 1e-6)
      if (point) {
        row[s.series] = point.y
      }
    })
    return row
  })
}

function detectRangeBands(seriesKeys: string[]): RangeBand[] {
  return seriesKeys
    .filter((key) => key.endsWith("_LOW"))
    .map((lowKey) => {
      const base = lowKey.replace(/_LOW$/, "")
      const highKey = `${base}_HIGH`
      return {
        base,
        lowKey,
        highKey,
        rangeBaseKey: `${base}__rangeBase`,
        bandKey: `${base}__rangeBand`,
        label: `${base} 정상범위`,
      }
    })
    .filter((band) => seriesKeys.includes(band.highKey))
}

function withRangeColumns(
  rows: ChartRow[],
  bands: RangeBand[]
): ChartRow[] {
  return rows.map((row) => {
    const next: ChartRow = { ...row }
    bands.forEach((band) => {
      const low = row[band.lowKey]
      const high = row[band.highKey]
      if (typeof low === "number" && typeof high === "number") {
        next[band.rangeBaseKey] = low
        next[band.bandKey] = Math.max(high - low, 0)
      }
    })
    return next
  })
}

const LINE_COLORS = [
  "oklch(0.45 0.12 230)",
  "oklch(0.55 0.16 25)",
  "oklch(0.5 0.12 150)",
  "oklch(0.5 0.14 300)",
]

const RANGE_FILL = "oklch(0.72 0.08 230 / 0.35)"
const PRED_STROKE = "oklch(0.55 0.04 250)"

export interface VolumeTimeChartProps {
  title: string
  description: string
  seriesList: VolumeTimeSeries[]
}

export const VolumeTimeChart: React.FC<VolumeTimeChartProps> = ({
  title,
  description,
  seriesList,
}) => {
  if (seriesList.length === 0) {
    return (
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            등록된 데이터가 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const seriesKeys = seriesList.map((s) => s.series)
  const bands = detectRangeBands(seriesKeys)
  const bandRelated = new Set(
    bands.flatMap((b) => [b.lowKey, b.highKey, b.rangeBaseKey, b.bandKey])
  )
  const lineKeys = seriesKeys.filter((key) => !bandRelated.has(key))
  const data = withRangeColumns(toChartRows(seriesList), bands)

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 16, left: 8, bottom: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                type="number"
                domain={[0, "dataMax"]}
                tickCount={7}
                label={{
                  value: "시간 (s)",
                  position: "insideBottom",
                  offset: -2,
                }}
              />
              <YAxis
                type="number"
                domain={[0, "auto"]}
                tickCount={6}
                label={{
                  value: "호기량 (L)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip
                formatter={(value: number, name: string, item: { payload?: ChartRow }) => {
                  if (typeof value !== "number") return null
                  if (name.includes("__rangeBase")) return null
                  if (name.includes("__rangeBand")) {
                    const band = bands.find((b) => b.bandKey === name)
                    if (!band || !item.payload) return null
                    const low = item.payload[band.lowKey]
                    const high = item.payload[band.highKey]
                    if (typeof low !== "number" || typeof high !== "number") {
                      return null
                    }
                    return [
                      `${low.toFixed(2)} – ${high.toFixed(2)} L`,
                      band.label,
                    ]
                  }
                  return [`${value.toFixed(2)} L`, name]
                }}
                labelFormatter={(label) => `시간 ${label} s`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 8 }}
              />
              {bands.map((band) => (
                <React.Fragment key={band.base}>
                  <Area
                    type="monotone"
                    dataKey={band.rangeBaseKey}
                    stackId={band.base}
                    stroke="none"
                    fill="transparent"
                    legendType="none"
                    tooltipType="none"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey={band.bandKey}
                    name={band.label}
                    stackId={band.base}
                    stroke="none"
                    fill={RANGE_FILL}
                    legendType="rect"
                    isAnimationActive={false}
                  />
                </React.Fragment>
              ))}
              {lineKeys.map((key, index) => {
                const isPred = key.endsWith("_PRED")
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={
                      isPred
                        ? PRED_STROKE
                        : LINE_COLORS[index % LINE_COLORS.length]
                    }
                    strokeWidth={isPred ? 2 : 2.5}
                    strokeDasharray={isPred ? "6 4" : undefined}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                )
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
