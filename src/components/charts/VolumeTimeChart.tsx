import React, { useEffect, useMemo, useRef, useState } from "react"
import { init, use, type EChartsType, type ComposeOption } from "echarts/core"
import { LineChart, type LineSeriesOption } from "echarts/charts"
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type DataZoomComponentOption,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { VolumeTimeSeries } from "@/data/volumeTime"

use([
  LineChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

type ChartOption = ComposeOption<
  | LineSeriesOption
  | DataZoomComponentOption
  | GridComponentOption
  | LegendComponentOption
  | TooltipComponentOption
>

const LINE_COLORS = ["#237899", "#bd563d", "#368563", "#865eac"]
const PRED_STROKE = "#738290"

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character] as string))
}

function createOption(seriesList: VolumeTimeSeries[]): ChartOption {
  const source = new Map(seriesList.map((series) => [series.series, series]))
  const bands = seriesList
    .filter((series) => series.series.endsWith("_LOW"))
    .map((low) => ({ low, high: source.get(low.series.replace(/_LOW$/, "_HIGH")) }))
    .filter((band): band is { low: VolumeTimeSeries; high: VolumeTimeSeries } => Boolean(band.high))
  const bandKeys = new Set(bands.flatMap(({ low, high }) => [low.series, high.series]))
  const lines = seriesList.filter((series) => !bandKeys.has(series.series))
  const chartSeries: LineSeriesOption[] = []
  const bandLabels = new Map<string, { low: VolumeTimeSeries; high: VolumeTimeSeries }>()

  bands.forEach(({ low, high }) => {
    const label = `${low.series.replace(/_LOW$/, "")} 정상범위`
    bandLabels.set(label, { low, high })
    // Normalize time keys to the same tolerance used by the tooltip.
    const timeKey = (time: number) => Math.round(time * 1e6)
    const highPoints = new Map(high.datas.map((point) => [timeKey(point.x), point.y]))
    chartSeries.push({
      name: `${label}__base`, type: "line", stack: label,
      data: low.datas.map((point) => [point.x, point.y]),
      symbol: "none", lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 },
      silent: true, tooltip: { show: false }, emphasis: { disabled: true },
      smooth: false, clip: true,
    }, {
      name: label, type: "line", stack: label,
      data: low.datas.map((point) => {
        const upper = highPoints.get(timeKey(point.x))
        return [point.x, upper === undefined ? null : Math.max(upper - point.y, 0)]
      }),
      symbol: "none", lineStyle: { opacity: 0 },
      itemStyle: { color: "#8bb7cc" }, areaStyle: { color: "#8bb7cc", opacity: 0.35 },
      emphasis: { disabled: true }, smooth: false, clip: true,
    })
  })
  lines.forEach((series, index) => {
    const isPred = series.series.endsWith("_PRED")
    chartSeries.push({
      name: series.series, type: "line",
      data: series.datas.map((point) => [point.x, point.y]),
      showSymbol: false, symbolSize: 7, smooth: false, clip: true,
      itemStyle: { color: isPred ? PRED_STROKE : LINE_COLORS[index % LINE_COLORS.length] },
      lineStyle: { width: isPred ? 2 : 2.5, type: isPred ? "dashed" : "solid" },
      emphasis: { focus: "series" },
    })
  })
  const { maxX, maxY } = seriesList.reduce((extent, series) => {
    series.datas.forEach((point) => {
      extent.maxX = Math.max(extent.maxX, point.x)
      extent.maxY = Math.max(extent.maxY, point.y)
    })
    return extent
  }, { maxX: 1, maxY: 0 })
  // Small headroom without the former automatic jump from 5.44 L to 10 L.
  const yUpper = Math.max(1, Math.ceil(maxY * 1.05 * 10) / 10)

  return {
    animation: false,
    textStyle: { fontFamily: "inherit", color: "#64748b" },
    grid: { left: 66, right: 22, top: 56, bottom: 46 },
    legend: {
      type: "scroll", top: 0, right: 0, left: 0,
      data: [...bandLabels.keys(), ...lines.map((series) => series.series)],
    },
    xAxis: {
      type: "value", min: 0, max: maxX, name: "시간 (s)",
      nameLocation: "middle", nameGap: 28,
      axisLabel: { hideOverlap: true }, splitLine: { show: false },
    },
    yAxis: {
      type: "value", min: 0, max: yUpper, name: "호기량 (L)",
      nameLocation: "middle", nameGap: 48,
      axisLabel: { hideOverlap: true }, splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
    },
    tooltip: {
      trigger: "axis", confine: true,
      formatter: (params) => {
        const items = Array.isArray(params) ? params : [params]
        const firstValue = items[0]?.value
        if (!Array.isArray(firstValue)) return ""
        const time = Number(firstValue[0])
        const entries = items.flatMap((item) => {
          const name = item.seriesName ?? ""
          if (name.endsWith("__base") || !Array.isArray(item.value)) return []
          const band = bandLabels.get(name)
          if (band) {
            const low = band.low.datas.find((point) => Math.abs(point.x - time) < 1e-6)
            const high = band.high.datas.find((point) => Math.abs(point.x - time) < 1e-6)
            return low && high ? [`${escapeHtml(name)}: ${low.y.toFixed(2)} – ${high.y.toFixed(2)} L`] : []
          }
          return [`${escapeHtml(name)}: ${Number(item.value[1]).toFixed(2)} L`]
        })
        return `시간 ${time.toFixed(2)} s<br/>${entries.join("<br/>")}`
      },
    },
    dataZoom: [
      {
        id: "time-zoom", type: "inside", xAxisIndex: 0,
        filterMode: "none", start: 0, end: 100, minValueSpan: 0.01,
        zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: false,
      },
      {
        id: "volume-zoom", type: "inside", yAxisIndex: 0,
        filterMode: "none", start: 0, end: 100, minValueSpan: 0.01,
        zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: false,
      },
    ],
    series: chartSeries,
  }
}

export interface VolumeTimeChartProps {
  title: string
  description: string
  seriesList: VolumeTimeSeries[]
}

export const VolumeTimeChart: React.FC<VolumeTimeChartProps> = ({ title, description, seriesList }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const option = useMemo(() => createOption(seriesList), [seriesList])
  const hasData = seriesList.some((series) => series.datas.length > 0)

  useEffect(() => {
    if (!hasData || !containerRef.current) return
    const chart = init(containerRef.current)
    chartRef.current = chart
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(containerRef.current)
    chart.on("datazoom", () => {
      const zooms = chart.getOption().dataZoom as Array<{ start?: number; end?: number }>
      setZoomed(zooms.some((zoom) => (zoom.start ?? 0) > 0.0001 || (zoom.end ?? 100) < 99.9999))
    })
    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [hasData])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true })
    setZoomed(false)
  }, [option, hasData])

  function resetZoom() {
    chartRef.current?.dispatchAction({
      type: "dataZoom",
      batch: [{ dataZoomId: "time-zoom", start: 0, end: 100 }, { dataZoomId: "volume-zoom", start: 0, end: 100 }],
    })
  }

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                차트 위에서 휠로 확대·축소 · 드래그로 이동{zoomed ? " · 확대 중" : ""}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={resetZoom} disabled={!zoomed}>
                전체 보기
              </Button>
            </div>
            <div ref={containerRef} className="h-[360px] w-full" role="img" aria-label={`${title} · 휠 확대·축소 가능`} />
          </>
        ) : <p className="text-sm text-muted-foreground">등록된 데이터가 없습니다.</p>}
      </CardContent>
    </Card>
  )
}
