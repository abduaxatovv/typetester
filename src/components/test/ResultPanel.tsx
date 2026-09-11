import { RotateCcw, LayoutDashboard, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPercent, formatDuration } from '@/lib/utils'
import type { TestResult } from '@/types'

interface ResultPanelProps {
  result: TestResult
  bestWpm: number
  newlyUnlocked: string[]
  onRestart: () => void
  onDashboard: () => void
}

const MODE_LABEL: Record<string, string> = {
  time: 'Time',
  words: 'Words',
  quote: 'Quote',
  custom: 'Custom',
  zen: 'Zen',
}

export function ResultPanel({
  result,
  bestWpm,
  newlyUnlocked,
  onRestart,
  onDashboard,
}: ResultPanelProps) {
  const recentBest = result.wpm >= bestWpm

  return (
    <div className="mx-auto w-full max-w-2xl animate-fade-in">
      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{MODE_LABEL[result.mode] ?? result.mode}</Badge>
              <Badge variant="neutral">{result.language.toUpperCase()}</Badge>
              {result.target ? (
                <Badge variant="secondary">
                  {result.mode === 'time' ? `${result.target}s` : `${result.target} words`}
                </Badge>
              ) : null}
            </div>
            <div>
              <span className="text-6xl font-bold tracking-tight tabular-nums sm:text-7xl">
                {Math.round(result.wpm)}
              </span>
              <span className="ml-2 text-2xl text-muted">WPM</span>
            </div>
            {recentBest && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-accent">
                <Trophy className="h-4 w-4" />
                New personal best
              </div>
            )}
          </div>

          {newlyUnlocked.length > 0 && (
            <div className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3">
              <p className="text-sm font-semibold text-accent">
                🏆 Achievement{newlyUnlocked.length > 1 ? 's' : ''} unlocked
              </p>
              <p className="mt-0.5 text-sm text-text">{newlyUnlocked.join(' · ')}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Accuracy" value={formatPercent(result.accuracy)} />
            <Metric label="Characters" value={String(result.totalChars)} />
            <Metric label="Errors" value={String(result.errors)} />
            <Metric label="Correct" value={String(result.correctChars)} />
            <Metric label="Incorrect" value={String(result.incorrectChars)} />
            <Metric label="Consistency" value={formatPercent(result.consistency)} />
            <Metric label="Time" value={formatDuration(result.elapsedSeconds)} />
            <Metric label="Raw" value={`${Math.round(result.rawWpm)} wpm`} />
            <Metric label="Best" value={recentBest ? '—' : `${Math.max(bestWpm, 0)} wpm`} />
          </div>

          <Separator />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1" onClick={onRestart}>
              <RotateCcw className="h-4 w-4" />
              Restart test
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={onDashboard}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
          <p className="text-center text-xs text-faint">Press Enter to restart</p>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg-inset px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}