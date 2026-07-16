import React from "react"
import { Redirect, RouteComponentProps } from "react-router-dom"
import { MergedVolumeTimeChart } from "@/components/charts/MergedVolumeTimeChart"
import { AppLayout } from "@/components/layout/AppLayout"
import { SpirometryResultsTable } from "@/components/tables/SpirometryResultsTable"
import { useSpirometryResults } from "@/lib/spirometryStorage"

type MatchParams = { date: string }

export const ExamDatePage: React.FC<RouteComponentProps<MatchParams>> = ({
  match,
}) => {
  const { date } = match.params
  const results = useSpirometryResults()
  const examDates = results.map((result) => result.examDate)

  if (!examDates.includes(date)) {
    return <Redirect to="/" />
  }

  return (
    <AppLayout title={`검사일 ${date}`}>
      <div className="flex flex-col gap-6">
        <MergedVolumeTimeChart seriesFilter={date} />
        <SpirometryResultsTable examDate={date} />
      </div>
    </AppLayout>
  )
}
