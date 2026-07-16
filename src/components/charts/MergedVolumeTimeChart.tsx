import React, { useMemo } from "react"
import { VolumeTimeChart } from "@/components/charts/VolumeTimeChart"
import { filterExamDateSeries } from "@/data/volumeTime"
import { useSpirometryResults } from "@/lib/spirometryStorage"
import { buildMergedVolumeTimeSeries } from "@/lib/volumeTimeFromSpirometry"

interface Props {
  seriesFilter?: string
  selectedExamDates?: string[]
}

export const MergedVolumeTimeChart: React.FC<Props> = ({
  seriesFilter,
  selectedExamDates,
}) => {
  const results = useSpirometryResults()
  const seriesList = useMemo(() => {
    const built = buildMergedVolumeTimeSeries(results)
    if (selectedExamDates) {
      return filterExamDateSeries(built, selectedExamDates)
    }
    return filterExamDateSeries(built, seriesFilter)
  }, [results, seriesFilter, selectedExamDates])

  return (
    <VolumeTimeChart
      title="시간당 호기량 (전·후 병합)"
      description="Volume–Time · Pre / Post bronchodilator combined"
      seriesList={seriesList}
    />
  )
}
