import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDataStore } from '@/store/dataStore'
import { bestByMode, seriesOverTime, summarize, ewma } from '@/lib/statistics'
import { formatPercent, formatWpm } from '@/lib/utils'
import { modeName } from '@/pages/Dashboard'

const COLORS = {
  wpm: 'var(--accent)',
  ema: 'var(--caret)',
  accuracy: '#7fe08a',
}

const chartStyle = {
  fontSize: 11,
  stroke: 'var(--text-faint)' as const,
}

export default function Statistics() {
  const results = useDataStore((s) => s.results)
  const summary = useMemo(() => summarize(results), [results])
  const series = useMemo(() => seriesOverTime(results), [results])
  const best = useMemo(() => bestByMode(results), [results])
  const modes = Object.keys(best)

  const wpmData = useMemo(
    () =>
      series.map((p, i) => {
        const ema = ewma(series.map((x) => x.wpm), 0.25)
        return { index: p.index, wpm: p.wpm, trend: Math.round(ema[i] * 10) / 10 }
      }),
    [series],
  )
  const accData = useMemo(
    () => series.map((p) => ({ index: p.index, acc: p.accuracy })),
    [series],
  )

  if (results.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-muted">No statistics yet.</p>
        <p className="mt-1 text-sm text-faint">Finish a test to populate charts and records.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Statistics</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigMetric label="Best WPM" value={formatWpm(summary.bestWpm)} />
        <BigMetric label="Average WPM" value={formatWpm(summary.avgWpm)} />
        <BigMetric label="Average Acc" value={formatPercent(summary.avgAccuracy)} />
        <BigMetric label="Total tests" value={String(summary.count)} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>WPM over time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wpmData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="index" tick={chartStyle} stroke="var(--border)" />
                  <YAxis tick={chartStyle} domain={[0, 'auto']} stroke="var(--border)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--text)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="wpm"
                    stroke={COLORS.wpm}
                    strokeWidth={2}
                    dot={false}
                    name="WPM"
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke={COLORS.ema}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    name="Trend"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accuracy over time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="index" tick={chartStyle} stroke="var(--border)" />
                  <YAxis
                    domain={[0, 100]}
                    tick={chartStyle}
                    stroke="var(--border)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--text)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="acc"
                    stroke={COLORS.accuracy}
                    strokeWidth={2}
                    dot={false}
                    name="Accuracy %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Personal records by mode</h2>
        {modes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">No records yet.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modes.map((m) => {
              const record = best[m]
              if (!record) return null
              return (
                <Card key={m}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{modeName(m as never)}</Badge>
                      <span className="text-xs text-faint">{short(record.createdAt)}</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold tabular-nums">
                      {Math.round(record.wpm)}
                      <span className="ml-1 text-xs font-normal text-muted">WPM</span>
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {formatPercent(record.accuracy)} accuracy · {record.errors} errors ·{' '}
                      {(record.elapsedSeconds).toFixed(1)}s
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function BigMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        <div className="text-xs text-muted">{label}</div>
      </CardContent>
    </Card>
  )
}

function short(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}