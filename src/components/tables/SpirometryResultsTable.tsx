import React, { useMemo } from "react"
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
import { SpirometryMetric } from "@/data/spirometryResults"
import { useSpirometryResults } from "@/lib/spirometryStorage"
import { cn } from "@/lib/utils"

interface Props {
  examDate?: string
}

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(parseFloat(value.toFixed(2)))
}

function ChangeCell({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "tabular-nums",
        value > 0 && "text-emerald-700",
        value < 0 && "text-red-700"
      )}
    >
      {value > 0 ? `+${value}` : value}
    </span>
  )
}

export const SpirometryResultsTable: React.FC<Props> = ({ examDate }) => {
  const results = useSpirometryResults()
  const metrics = useMemo(() => {
    if (examDate) {
      return results.find((result) => result.examDate === examDate)?.metrics ?? []
    }
    return results.flatMap((result) => result.metrics)
  }, [results, examDate])

  if (metrics.length === 0) {
    return null
  }

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>폐기능 검사 수치</CardTitle>
        <CardDescription>
          Spirometry metrics
          {examDate ? ` · ${examDate}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>항목</TableHead>
              <TableHead>단위</TableHead>
              <TableHead>정상범위</TableHead>
              <TableHead className="text-right">Pred</TableHead>
              <TableHead className="text-right">Pre Meas</TableHead>
              <TableHead className="text-right">Pre % Pred</TableHead>
              <TableHead className="text-right">Post Meas</TableHead>
              <TableHead className="text-right">Post % Pred</TableHead>
              <TableHead className="text-right">% Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((row: SpirometryMetric) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell className="tabular-nums">{row.normal_range}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.pred)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.pre_meas)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row["pre % pred"]}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.post_meas)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row["post % pred"]}
                </TableCell>
                <TableCell className="text-right">
                  <ChangeCell value={row["% change"]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
