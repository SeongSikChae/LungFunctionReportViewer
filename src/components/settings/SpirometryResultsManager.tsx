import React, { useMemo, useRef, useState } from "react"
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  addExamDate,
  calculateFev1OverFvcRatio,
  calculatePercentChange,
  calculatePostPercentPred,
  calculatePrePercentPred,
  canAddRatioMetric,
  createEmptyMetricInput,
  deleteExamDate,
  deleteMetric,
  downloadSpirometryExport,
  importSpirometryResults,
  isValidExamDate,
  parseSpirometryImportData,
  metricToInput,
  SPIROMETRY_METRIC_NAMES,
  SpirometryMetricInput,
  upsertMetric,
  useSpirometryResults,
} from "@/lib/spirometryStorage"
import { SpirometryMetric } from "@/data/spirometryResults"
import { cn } from "@/lib/utils"

const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(parseFloat(value.toFixed(2)))
}

function MetricForm({
  initial,
  existingNames,
  siblingMetrics,
  onSubmit,
  onCancel,
  submitLabel,
  lockName = false,
}: {
  initial: SpirometryMetricInput
  existingNames: string[]
  siblingMetrics: SpirometryMetric[]
  onSubmit: (input: SpirometryMetricInput) => void
  onCancel?: () => void
  submitLabel: string
  lockName?: boolean
}) {
  const [form, setForm] = useState<SpirometryMetricInput>(initial)
  const [error, setError] = useState("")
  const isRatioMetric = form.name === "FEV1 / FVC %"
  const fev1 = siblingMetrics.find((metric) => metric.name === "FEV1")
  const fvc = siblingMetrics.find((metric) => metric.name === "FVC")

  const effectiveValues = useMemo(() => {
    if (isRatioMetric && fev1 && fvc) {
      return {
        pre_meas: calculateFev1OverFvcRatio(fev1.pre_meas, fvc.pre_meas),
        post_meas: calculateFev1OverFvcRatio(fev1.post_meas, fvc.post_meas),
      }
    }

    return {
      pre_meas: form.pre_meas,
      post_meas: form.post_meas,
    }
  }, [isRatioMetric, fev1, fvc, form.pre_meas, form.post_meas])

  const calculated = useMemo(
    () => ({
      prePercentPred: calculatePrePercentPred(form.pred, effectiveValues.pre_meas),
      postPercentPred: calculatePostPercentPred(form.pred, effectiveValues.post_meas),
      percentChange: calculatePercentChange(
        effectiveValues.pre_meas,
        effectiveValues.post_meas
      ),
    }),
    [form.pred, effectiveValues.pre_meas, effectiveValues.post_meas]
  )

  const availableNames = SPIROMETRY_METRIC_NAMES.filter(
    (name) => name === initial.name || !existingNames.includes(name)
  )

  function updateField<K extends keyof SpirometryMetricInput>(
    key: K,
    value: SpirometryMetricInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.normal_range.trim()) {
      setError("정상 범위를 입력해 주세요.")
      return
    }
    if (isRatioMetric && (!fev1 || !fvc)) {
      setError("FEV1 / FVC % 항목을 추가하려면 FVC와 FEV1이 먼저 등록되어야 합니다.")
      return
    }
    setError("")
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">항목</span>
          <select
            className={inputClassName}
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value as SpirometryMetricInput["name"])
            }
            disabled={lockName}
          >
            {availableNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">정상 범위</span>
          <input
            className={inputClassName}
            value={form.normal_range}
            onChange={(event) => updateField("normal_range", event.target.value)}
            placeholder="예: 3.18-4.08"
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">예측값</span>
          <input
            className={inputClassName}
            type="number"
            step="any"
            value={form.pred}
            onChange={(event) => updateField("pred", Number(event.target.value))}
          />
        </label>

        {!isRatioMetric ? (
          <>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">기관지 확장제 전 실제값</span>
              <input
                className={inputClassName}
                type="number"
                step="any"
                value={form.pre_meas}
                onChange={(event) =>
                  updateField("pre_meas", Number(event.target.value))
                }
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">기관지 확장제 후 실제값</span>
              <input
                className={inputClassName}
                type="number"
                step="any"
                value={form.post_meas}
                onChange={(event) =>
                  updateField("post_meas", Number(event.target.value))
                }
              />
            </label>
          </>
        ) : null}
      </div>

      {isRatioMetric ? (
        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
          <div className="text-sm">
            <p className="text-muted-foreground">기관지 확장제 전 실제값</p>
            <p className="mt-1 font-medium tabular-nums">
              {formatNumber(effectiveValues.pre_meas)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              FEV1 / FVC 값으로 자동 계산
            </p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">기관지 확장제 후 실제값</p>
            <p className="mt-1 font-medium tabular-nums">
              {formatNumber(effectiveValues.post_meas)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              FEV1 / FVC 값으로 자동 계산
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
        <div className="text-sm">
          <p className="text-muted-foreground">기관지 확장제 전 예측값 대비 비율</p>
          <p className="mt-1 font-medium tabular-nums">{calculated.prePercentPred}%</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">기관지 확장제 후 예측값 대비 비율</p>
          <p className="mt-1 font-medium tabular-nums">{calculated.postPercentPred}%</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">기관지 확장제 후 변동 비율</p>
          <p
            className={cn(
              "mt-1 font-medium tabular-nums",
              calculated.percentChange > 0 && "text-emerald-700",
              calculated.percentChange < 0 && "text-red-700"
            )}
          >
            {calculated.percentChange > 0
              ? `+${calculated.percentChange}`
              : calculated.percentChange}
            %
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export const SpirometryResultsManager: React.FC = () => {
  const results = useSpirometryResults()
  const examDates = useMemo(
    () => results.map((result) => result.examDate).sort(),
    [results]
  )

  const [selectedDate, setSelectedDate] = useState<string>(
    () => examDates[0] ?? ""
  )
  const [newExamDate, setNewExamDate] = useState("")
  const [dateError, setDateError] = useState("")
  const [importError, setImportError] = useState("")
  const [importMessage, setImportMessage] = useState("")
  const [editingName, setEditingName] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const selectedResult = results.find((result) => result.examDate === selectedDate)
  const metrics = selectedResult?.metrics ?? []
  const existingNames = metrics.map((metric) => metric.name)
  const editingMetric = editingName
    ? metrics.find((metric) => metric.name === editingName)
    : undefined

  const availableMetricNames = SPIROMETRY_METRIC_NAMES.filter((name) => {
    if (existingNames.includes(name)) {
      return false
    }
    if (name === "FEV1 / FVC %") {
      return canAddRatioMetric(metrics)
    }
    return true
  })

  React.useEffect(() => {
    if (examDates.length === 0) {
      setSelectedDate("")
      return
    }
    if (!examDates.includes(selectedDate)) {
      setSelectedDate(examDates[0])
    }
  }, [examDates, selectedDate])

  function handleAddExamDate() {
    if (!isValidExamDate(newExamDate)) {
      setDateError("검사일자는 YYYYMMDD 형식 8자리로 입력해 주세요.")
      return
    }
    try {
      addExamDate(newExamDate)
      setSelectedDate(newExamDate)
      setNewExamDate("")
      setDateError("")
      setEditingName(null)
    } catch (error) {
      setDateError(
        error instanceof Error ? error.message : "검사일을 추가하지 못했습니다."
      )
    }
  }

  function handleDeleteExamDate() {
    if (!selectedDate) return
    if (!window.confirm(`검사일 ${selectedDate}의 모든 데이터를 삭제할까요?`)) {
      return
    }
    deleteExamDate(selectedDate)
    setEditingName(null)
  }

  function handleCreateMetric(input: SpirometryMetricInput) {
    if (!selectedDate) return
    upsertMetric(selectedDate, input)
    setEditingName(null)
  }

  function handleUpdateMetric(input: SpirometryMetricInput) {
    if (!selectedDate || !editingName) return
    upsertMetric(selectedDate, input)
    setEditingName(null)
  }

  function handleDeleteMetric(metricName: string) {
    if (!selectedDate) return
    if (!window.confirm(`${metricName} 항목을 삭제할까요?`)) {
      return
    }
    deleteMetric(selectedDate, metricName)
    if (editingName === metricName) {
      setEditingName(null)
    }
  }

  function handleExport() {
    downloadSpirometryExport()
    setImportError("")
    setImportMessage("JSON 파일을 다운로드했습니다.")
  }

  function handleImportClick() {
    importInputRef.current?.click()
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setImportError("")
    setImportMessage("")

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      const nextResults = parseSpirometryImportData(parsed)

      if (
        !window.confirm(
          `가져온 검사일 ${nextResults.length}건으로 현재 데이터를 모두 교체할까요?`
        )
      ) {
        return
      }

      importSpirometryResults(parsed)
      setEditingName(null)
      setImportMessage(
        `검사일 ${nextResults.length}건의 데이터를 가져왔습니다.`
      )
    } catch (error) {
      setImportMessage("")
      setImportError(
        error instanceof Error
          ? error.message
          : "JSON 파일을 가져오지 못했습니다."
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>데이터 백업</CardTitle>
          <CardDescription>
            등록된 폐기능 검사 결과를 JSON 파일로보내거나 가져올 수
            있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export JSON
            </Button>
            <Button type="button" variant="outline" onClick={handleImportClick}>
              <Upload className="size-4" />
              Import JSON
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
          {importMessage ? (
            <p className="text-sm text-emerald-700">{importMessage}</p>
          ) : null}
          {importError ? (
            <p className="text-sm text-destructive">{importError}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>검사일 관리</CardTitle>
          <CardDescription>
            검사일별 폐기능 검사 결과 데이터를 localStorage에 저장합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="grid flex-1 gap-1.5 text-sm">
              <span className="font-medium">검사일자</span>
              <select
                className={inputClassName}
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value)
                  setEditingName(null)
                }}
                disabled={examDates.length === 0}
              >
                {examDates.length === 0 ? (
                  <option value="">등록된 검사일 없음</option>
                ) : (
                  examDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="grid flex-1 gap-1.5 text-sm">
              <span className="font-medium">새 검사일자</span>
              <input
                className={inputClassName}
                value={newExamDate}
                onChange={(event) => setNewExamDate(event.target.value)}
                placeholder="예: 20231129"
                maxLength={8}
              />
            </label>

            <Button type="button" onClick={handleAddExamDate}>
              <Plus className="size-4" />
              검사일 추가
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteExamDate}
              disabled={!selectedDate}
            >
              <Trash2 className="size-4" />
              검사일 삭제
            </Button>
          </div>

          {dateError ? <p className="text-sm text-destructive">{dateError}</p> : null}
        </CardContent>
      </Card>

      {selectedDate ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{selectedDate} 검사 결과</CardTitle>
              <CardDescription>등록된 항목을 확인하고 수정하거나 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  등록된 항목이 없습니다. 아래에서 항목을 추가해 주세요.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>항목</TableHead>
                      <TableHead>정상 범위</TableHead>
                      <TableHead className="text-right">예측값</TableHead>
                      <TableHead className="text-right">확장제 전 실제값</TableHead>
                      <TableHead className="text-right">확장제 전 비율</TableHead>
                      <TableHead className="text-right">확장제 후 실제값</TableHead>
                      <TableHead className="text-right">확장제 후 비율</TableHead>
                      <TableHead className="text-right">변동 비율</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map((metric) => (
                      <TableRow key={metric.name}>
                        <TableCell className="font-medium">{metric.name}</TableCell>
                        <TableCell>{metric.normal_range}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(metric.pred)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(metric.pre_meas)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {metric["pre % pred"]}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(metric.post_meas)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {metric["post % pred"]}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            metric["% change"] > 0 && "text-emerald-700",
                            metric["% change"] < 0 && "text-red-700"
                          )}
                        >
                          {metric["% change"] > 0
                            ? `+${metric["% change"]}`
                            : metric["% change"]}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingName(metric.name)}
                            >
                              <Pencil className="size-4" />
                              수정
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMetric(metric.name)}
                            >
                              <Trash2 className="size-4" />
                              삭제
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {editingMetric ? (
            <Card>
              <CardHeader>
                <CardTitle>항목 수정</CardTitle>
                <CardDescription>{editingMetric.name} 데이터를 수정합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <MetricForm
                  key={editingMetric.name}
                  initial={metricToInput(editingMetric)}
                  existingNames={existingNames.filter(
                    (name) => name !== editingMetric.name
                  )}
                  siblingMetrics={metrics}
                  onSubmit={handleUpdateMetric}
                  onCancel={() => setEditingName(null)}
                  submitLabel="변경 저장"
                  lockName
                />
              </CardContent>
            </Card>
          ) : null}

          {availableMetricNames.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>항목 추가</CardTitle>
                <CardDescription>
                  FVC, FEV1을 먼저 등록한 뒤 FEV1 / FVC % 항목을 추가할 수
                  있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetricForm
                  key={`${selectedDate}-${availableMetricNames.join(",")}`}
                  initial={createEmptyMetricInput(availableMetricNames[0])}
                  existingNames={existingNames}
                  siblingMetrics={metrics}
                  onSubmit={handleCreateMetric}
                  submitLabel="항목 추가"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  이 검사일에는 모든 항목이 등록되어 있습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
