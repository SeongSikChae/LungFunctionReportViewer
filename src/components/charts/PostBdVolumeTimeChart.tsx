import React, { useMemo } from "react"
import { VolumeTimeChart } from "@/components/charts/VolumeTimeChart"
import { filterExamDateSeries } from "@/data/volumeTime"
import { useSpirometryResults } from "@/lib/spirometryStorage"
import { buildPostBdVolumeTimeSeries } from "@/lib/volumeTimeFromSpirometry"

interface Props {
  seriesFilter?: string
  selectedExamDates?: string[]
}

export const PostBdVolumeTimeChart: React.FC<Props> = ({
  seriesFilter,
  selectedExamDates,
}) => {
  const results = useSpirometryResults()
  const seriesList = useMemo(() => {
    const built = buildPostBdVolumeTimeSeries(results)
    if (selectedExamDates) {
      return filterExamDateSeries(built, selectedExamDates)
    }
    return filterExamDateSeries(built, seriesFilter)
  }, [results, seriesFilter, selectedExamDates])

  return (
    <VolumeTimeChart
      title="기관지 확장제 후 시간당 호기량"
      description="Volume–Time · Post-bronchodilator"
      seriesList={seriesList}
    />
  )
}
