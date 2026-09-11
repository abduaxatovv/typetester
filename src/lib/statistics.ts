import type { TestResult } from '@/types'

export interface TestSummary {
  count: number
  bestWpm: number
  avgWpm: number
  avgAccuracy: number
  totalTimeSeconds: number
  bestAccuracy: number
  bestWpmDate: string | null
  last: TestResult | null
  /** % change of the last test vs the average of the 10 before it. */
  trend10: number | null
}

export function summarize(results: TestResult[]): TestSummary {
  if (results.length === 0) {
    return {
      count: 0,
      bestWpm: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      totalTimeSeconds: 0,
      bestAccuracy: 0,
      bestWpmDate: null,
      last: null,
      trend10: null,
    }
  }

  const best = results.reduce((m, r) => (r.wpm > m ? r.wpm : m), 0)
  const bestIdx = results.reduce((m, r, i) => (r.wpm > results[m].wpm ? i : m), 0)
  const avgWpm = results.reduce((s, r) => s + r.wpm, 0) / results.length
  const avgAccuracy =
    results.reduce((s, r) => s + r.accuracy, 0) / results.length
  const total = results.reduce((s, r) => s + r.elapsedSeconds, 0)
  const bestAccuracy = results.reduce((m, r) => (r.accuracy > m ? r.accuracy : m), 0)

  const [newest, ...older] = [...results].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )
  let trend10: number | null = null
  const baseline = older.slice(
    0,
    10,
  )
  if (baseline.length >= 3 && newest) {
    const avg = baseline.reduce((s, r) => s + r.wpm, 0) / baseline.length
    if (avg > 0) trend10 = ((newest.wpm - avg) / avg) * 100
  }

  return {
    count: results.length,
    bestWpm: best,
    avgWpm,
    avgAccuracy,
    totalTimeSeconds: total,
    bestAccuracy,
    bestWpmDate: results[bestIdx]?.createdAt ?? null,
    last: newest ?? null,
    trend10,
  }
}

/** WPM/accuracy per result in chronological order (for charts). */
export function seriesOverTime(results: TestResult[]): {
  index: number
  date: string
  wpm: number
  accuracy: number
}[] {
  const sorted = [...results].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return sorted.map((r, index) => ({
    index: index + 1,
    date: r.createdAt,
    wpm: r.wpm,
    accuracy: Math.round(r.accuracy * 10) / 10,
  }))
}

/** Best result per mode. */
export function bestByMode(results: TestResult[]): Record<string, TestResult | null> {
  const out: Record<string, TestResult | null> = {}
  for (const r of results) {
    const cur = out[r.mode]
    if (!cur || r.wpm > cur.wpm) out[r.mode] = r
  }
  return out
}

/** Exponentially weighted moving average (smoothing for charts). */
export function ewma(values: number[], alpha = 0.3): number[] {
  const out: number[] = []
  let prev: number | null = null
  for (const v of values) {
    prev = prev === null ? v : alpha * v + (1 - alpha) * prev
    out.push(prev)
  }
  return out
}