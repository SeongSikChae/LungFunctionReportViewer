import { interpolateMonotoneCubic, Point } from "@/lib/interpolate"

export interface VolumeTimeSeries {
  series: string
  datas: Point[]
}

export function densifyVolumeTimeSeries(
  raw: VolumeTimeSeries[],
  step = 0.1
): VolumeTimeSeries[] {
  return raw.map((s) => ({
    series: s.series,
    datas: interpolateMonotoneCubic(s.datas, step),
  }))
}

export function isReferenceSeries(series: string): boolean {
  return /_(LOW|HIGH|PRED)$/.test(series)
}

function matchesExamDate(series: string, examDate: string): boolean {
  return series === examDate || series.startsWith(`${examDate}_`)
}

/** Exam-date filter: measured + matching reference bands. */
export function filterExamDateSeries(
  seriesList: VolumeTimeSeries[],
  seriesFilter?: string | string[]
): VolumeTimeSeries[] {
  if (Array.isArray(seriesFilter)) {
    if (seriesFilter.length === 0) {
      return []
    }

    return seriesList.filter(
      (series) =>
        seriesFilter.some((examDate) => matchesExamDate(series.series, examDate)) &&
        !isReferenceSeries(series.series)
    )
  }

  if (seriesFilter) {
    return seriesList.filter((series) =>
      matchesExamDate(series.series, seriesFilter)
    )
  }

  return seriesList.filter((series) => !isReferenceSeries(series.series))
}
