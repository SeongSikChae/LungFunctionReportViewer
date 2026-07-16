import React, { useEffect, useMemo, useState } from "react"
import { MergedVolumeTimeChart } from "@/components/charts/MergedVolumeTimeChart"
import { PostBdVolumeTimeChart } from "@/components/charts/PostBdVolumeTimeChart"
import { PreBdVolumeTimeChart } from "@/components/charts/PreBdVolumeTimeChart"
import {
  ExamDateSelector,
  getDefaultSelectedExamDates,
  normalizeSelectedExamDates,
} from "@/components/dashboard/ExamDateSelector"
import { AppLayout } from "@/components/layout/AppLayout"
import { SpirometryResultsTable } from "@/components/tables/SpirometryResultsTable"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSpirometryResults } from "@/lib/spirometryStorage"

export const DashboardPage: React.FC = () => {
  const results = useSpirometryResults()
  const examDates = useMemo(
    () => results.map((result) => result.examDate).sort(),
    [results]
  )
  const [selectedDates, setSelectedDates] = useState<string[]>([])

  useEffect(() => {
    setSelectedDates((prev) => {
      const normalized = normalizeSelectedExamDates(examDates, prev)
      if (normalized.length > 0) {
        return normalized
      }
      return getDefaultSelectedExamDates(examDates)
    })
  }, [examDates])

  return (
    <AppLayout title="폐기능 검사 결과 대시보드">
      {examDates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>등록된 검사 데이터 없음</CardTitle>
            <CardDescription>
              설정 메뉴에서 검사일과 폐기능 검사 결과를 입력하면 대시보드와
              좌측 메뉴에 반영됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              검사일을 추가한 뒤 FVC, FEV1 항목을 입력하면 차트가 표시됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <ExamDateSelector
            examDates={examDates}
            selectedDates={selectedDates}
            onChange={setSelectedDates}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <PreBdVolumeTimeChart selectedExamDates={selectedDates} />
            <PostBdVolumeTimeChart selectedExamDates={selectedDates} />
            <div className="md:col-span-2">
              <MergedVolumeTimeChart selectedExamDates={selectedDates} />
            </div>
          </div>

          {selectedDates.map((examDate) => (
            <SpirometryResultsTable key={examDate} examDate={examDate} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}
