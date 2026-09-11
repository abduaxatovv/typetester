import { memo } from 'react'
import { Progress } from '@/components/ui/progress'
import {
  formatPercent,
  formatTime,
  formatWpm,
} from '@/lib/utils'
import type { LiveState } from '@/components/test/useTestEngine'

interface LiveStatsBarProps {
  live: LiveState
  status: string
  mode: string
  showLiveWpm: boolean
  showLiveAccuracy: boolean
  showErrors: boolean
  showTimer: boolean
}

export const LiveStatsBar = memo(function LiveStatsBar({
  live,
  status,
  mode,
  showLiveWpm,
  showLiveAccuracy,
  showErrors,
  showTimer,
}: LiveStatsBarProps) {
  const { wpm, accuracy, errors, elapsedSeconds, remainingMs, progress } = live
  const isTime = mode === 'time'

  return (
    <div className="flex h-10 items-center gap-4 px-1 text-sm tabular-nums">
      {showLiveWpm && (
        <Stat label="wpm" value={formatWpm(wpm)} />
      )}
      {showLiveAccuracy && <Stat label="acc" value={formatPercent(accuracy)} />}
      {showErrors && <Stat label="err" value={String(errors)} />}
      {showTimer && (
        <Stat
          label={isTime ? 'time' : 'sec'}
          value={
            isTime && remainingMs !== null
              ? formatTime(Math.ceil(remainingMs / 1000))
              : formatTime(elapsedSeconds)
          }
        />
      )}
      <div className="ml-auto flex items-center gap-2">
        {status === 'idle' ? (
          <span className="hidden text-xs text-faint sm:inline">
            Start typing to begin
          </span>
        ) : null}
        <Progress
          value={Math.max(0, Math.min(100, progress * 100))}
          className="h-1.5 w-24 sm:w-40"
          aria-label="Test progress"
        />
      </div>
    </div>
  )
})

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-xs text-faint">{label}</span>
      <span className="text-base text-text">{value}</span>
    </span>
  )
}