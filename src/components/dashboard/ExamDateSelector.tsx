import React, { useEffect, useMemo, useState } from "react"
import { CalendarDays, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const MAX_DASHBOARD_EXAM_DATES = 4

const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

interface SelectorPanelProps {
  examDates: string[]
  selectedDates: string[]
  onChange: (dates: string[]) => void
}

interface Props extends SelectorPanelProps {}

function formatExamDateLabel(date: string): string {
  if (!/^\d{8}$/.test(date)) return date
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
}

function ExamDateSelectorPanel({
  examDates,
  selectedDates,
  onChange,
}: SelectorPanelProps) {
  const [search, setSearch] = useState("")
  const [limitMessage, setLimitMessage] = useState("")

  const isFull = selectedDates.length >= MAX_DASHBOARD_EXAM_DATES

  const availableDates = useMemo(
    () => examDates.filter((date) => !selectedDates.includes(date)),
    [examDates, selectedDates]
  )

  const filteredDates = useMemo(() => {
    const keyword = search.trim()
    if (!keyword) return availableDates

    return availableDates.filter((date) => {
      const label = formatExamDateLabel(date)
      return date.includes(keyword) || label.includes(keyword)
    })
  }, [availableDates, search])

  useEffect(() => {
    if (!limitMessage) return
    const timer = window.setTimeout(() => setLimitMessage(""), 2500)
    return () => window.clearTimeout(timer)
  }, [limitMessage])

  function addDate(date: string) {
    if (selectedDates.includes(date)) return

    if (isFull) {
      setLimitMessage(`최대 ${MAX_DASHBOARD_EXAM_DATES}개까지 선택할 수 있습니다.`)
      return
    }

    onChange([...selectedDates, date].sort())
    setLimitMessage("")
  }

  function removeDate(date: string) {
    onChange(selectedDates.filter((item) => item !== date))
    setLimitMessage("")
  }

  function selectRecentDates() {
    onChange(getDefaultSelectedExamDates(examDates))
    setLimitMessage("")
  }

  function clearSelection() {
    onChange([])
    setLimitMessage("")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            선택된 검사일 ({selectedDates.length}/{MAX_DASHBOARD_EXAM_DATES})
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={selectRecentDates}
              disabled={examDates.length === 0}
            >
              최근 {MAX_DASHBOARD_EXAM_DATES}개
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              disabled={selectedDates.length === 0}
            >
              전체 해제
            </Button>
          </div>
        </div>

        {selectedDates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedDates.map((date) => (
              <span
                key={date}
                className="inline-flex items-center gap-1 rounded-full border bg-accent px-3 py-1 text-sm"
              >
                <span className="font-medium tabular-nums">{date}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatExamDateLabel(date)})
                </span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  onClick={() => removeDate(date)}
                  aria-label={`${date} 선택 해제`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            표시할 검사일을 1개 이상 선택해 주세요.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">검사일 검색</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className={cn(inputClassName, "pl-9")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="YYYYMMDD 또는 YYYY-MM-DD"
              disabled={isFull || availableDates.length === 0}
            />
          </div>
        </label>

        <div className="max-h-48 overflow-y-auto rounded-md border">
          {isFull ? (
            <p className="p-3 text-sm text-muted-foreground">
              선택 한도에 도달했습니다. 다른 검사일을 추가하려면 선택된 항목을
              먼저 제거해 주세요.
            </p>
          ) : filteredDates.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {availableDates.length === 0
                ? "추가할 수 있는 검사일이 없습니다."
                : "검색 결과가 없습니다."}
            </p>
          ) : (
            <ul className="divide-y">
              {filteredDates.map((date) => (
                <li key={date}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => addDate(date)}
                  >
                    <span className="font-medium tabular-nums">{date}</span>
                    <span className="text-muted-foreground">
                      {formatExamDateLabel(date)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          등록된 검사일 {examDates.length}건 · 추가 가능 {availableDates.length}
          건
        </p>
      </div>

      {limitMessage ? (
        <p className="text-sm text-destructive">{limitMessage}</p>
      ) : null}
    </div>
  )
}

export const ExamDateSelector: React.FC<Props> = ({
  examDates,
  selectedDates,
  onChange,
}) => {
  const [open, setOpen] = useState(false)

  const summary =
    selectedDates.length === 0
      ? "선택된 검사일 없음"
      : `${selectedDates.length}개 · ${selectedDates.join(", ")}`

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">표시 검사일</p>
          <p className="truncate text-sm text-muted-foreground">{summary}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          <CalendarDays className="size-4" />
          검사일 선택
        </Button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-lg flex-col rounded-xl border bg-card shadow-lg"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exam-date-selector-title"
          >
            <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
              <div>
                <h2
                  id="exam-date-selector-title"
                  className="text-lg font-semibold tracking-tight"
                >
                  검사일 선택
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  대시보드에 표시할 검사일을 최대 {MAX_DASHBOARD_EXAM_DATES}
                  개까지 선택할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-6 py-4">
              <ExamDateSelectorPanel
                examDates={examDates}
                selectedDates={selectedDates}
                onChange={onChange}
              />
            </div>

            <div className="flex justify-end border-t px-6 py-4">
              <Button type="button" onClick={() => setOpen(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function getDefaultSelectedExamDates(examDates: string[]): string[] {
  return examDates.slice(-MAX_DASHBOARD_EXAM_DATES)
}

export function normalizeSelectedExamDates(
  examDates: string[],
  selectedDates: string[]
): string[] {
  return selectedDates
    .filter((date) => examDates.includes(date))
    .slice(0, MAX_DASHBOARD_EXAM_DATES)
}
