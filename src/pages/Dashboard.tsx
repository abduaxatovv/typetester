import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Keyboard,
  Clock,
  Type,
  Quote,
  FileText,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
  Timer,
  Trophy,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Logo } from '@/components/Logo'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { summarize } from '@/lib/statistics'
import { formatDuration, formatPercent, formatWpm } from '@/lib/utils'
import type { TestMode } from '@/types'

const QUICK_MODES: { mode: TestMode; label: string; desc: string; icon: typeof Clock }[] = [
  { mode: 'time', label: 'Time', desc: 'Beat the countdown', icon: Clock },
  { mode: 'words', label: 'Words', desc: 'Fix word counts', icon: Type },
  { mode: 'quote', label: 'Quote', desc: 'Famous lines', icon: Quote },
  { mode: 'custom', label: 'Custom', desc: 'Your own text', icon: FileText },
  { mode: 'zen', label: 'Zen', desc: 'Distraction free', icon: Moon },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const results = useDataStore((s) => s.results)
  const settings = useSettingsStore((s) => s.settings)
  const summary = useMemo(() => summarize(results), [results])
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    try {
      setDownloadError(null)
      setDownloading(true)
      const res = await fetch('TypeTester.exe')
      if (!res.ok) throw new Error('Not found')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'TypeTester.exe'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      // The installer is produced by `npm run tauri:build`; copy the resulting
      // .exe into `public/` so the static build can serve it. In dev mode it
      // may not exist yet — tell the user rather than navigating away.
      setDownloadError(
        'Windows installer not available here. Put the .exe into `public/` and rebuild.',
      )
    } finally {
      setDownloading(false)
    }
  }

  const last = summary.last
  const recent = useMemo(
    () => [...results].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [results],
  )

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-elevated p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">TypeTester</h1>
            <p className="text-sm text-muted">Practice. Type. Improve.</p>
          </div>
        </div>
        <p className="max-w-xl text-sm text-muted">
          Track your typing speed and accuracy — 100% offline. Your data never
          leaves this device.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => navigate('/test')}>
            <Keyboard className="h-4 w-4" />
            Quick start
          </Button>
          <Button size="lg" variant="secondary" onClick={handleDownload} disabled={downloading}>
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing…' : 'Download Windows app'}
          </Button>
          <Link to="/test">
            <Button size="lg" variant="secondary">
              {modeName(settings.defaultMode)}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {last ? (
          <Badge variant="secondary" className="w-fit">
            <Zap className="h-3 w-3" />
            Last: {Math.round(last.wpm)} WPM at {formatPercent(last.accuracy)} accuracy
          </Badge>
        ) : (
          <Badge variant="neutral" className="w-fit">
            No tests yet — take your first one above
          </Badge>
        )}
      </section>

      {/* Desktop download */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-bg-inset p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-surface p-2">
            <Download className="h-5 w-5 text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium">Windows desktop app</p>
            <p className="max-w-md text-xs text-muted">
              Click the button to download the TypeTester .exe installer and run it on any Windows
              PC — fully offline, no accounts, no cloud. Your data stays on your device.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
          <Download className="h-4 w-4" />
          {downloading ? 'Preparing…' : 'Get Windows app'}
        </Button>
      </section>
      {downloadError ? (
        <p className="rounded-lg border border-border bg-bg-inset px-4 py-2 text-xs text-red-400">
          {downloadError}
        </p>
      ) : null}

      {/* Metric grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard icon={Trophy} label="Best WPM" value={formatWpm(summary.bestWpm)} />
        <MetricCard icon={Zap} label="Average WPM" value={formatWpm(summary.avgWpm)} />
        <MetricCard icon={Target} label="Average Acc" value={formatPercent(summary.avgAccuracy)} />
        <MetricCard icon={Type} label="Tests" value={String(summary.count)} />
        <MetricCard icon={Timer} label="Typing time" value={formatDuration(summary.totalTimeSeconds)} />
      </section>

      {/* Improvement + quick modes */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Improvement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.trend10 === null ? (
              <p className="text-sm text-muted">
                Complete at least 4 tests to see your improvement trend.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                {summary.trend10 >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-400" />
                )}
                <div>
                  <div className="text-xl font-semibold">
                    {summary.trend10 >= 0 ? '+' : ''}
                    {summary.trend10.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted">
                    vs. average of your previous tests
                  </div>
                </div>
                {summary.trend10 === 0 ? <Minus /> : null}
              </div>
            )}
            {last && (
              <div className="rounded-xl bg-bg-inset p-4">
                <div className="text-xs text-muted">Latest result</div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-2xl font-bold tabular-nums">
                    {Math.round(last.wpm)}
                    <span className="ml-1 text-sm font-normal text-muted">WPM</span>
                  </span>
                  <span className="text-sm tabular-nums text-muted">·</span>
                  <span className="text-sm tabular-nums">{formatPercent(last.accuracy)}</span>
                  <span className="text-sm tabular-nums text-muted">·</span>
                  <span className="text-sm text-muted">{modeName(last.mode)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick modes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_MODES.map(({ mode, label, desc, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => navigate(`/test?mode=${mode}`)}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-bg-inset p-3.5 text-left transition-colors hover:border-accent/50 hover:bg-surface cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs leading-tight text-muted">{desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent history */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Recent tests</h2>
          <Link to="/history" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        {results.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              No results yet. Head to the typing test and finish one.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-faint">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Mode</th>
                    <th className="pb-2 text-right font-medium">WPM</th>
                    <th className="pb-2 text-right font-medium">Acc</th>
                    <th className="hidden pb-2 text-right font-medium sm:table-cell">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="py-2 tabular-nums text-muted">{shortDate(r.createdAt)}</td>
                      <td className="py-2">{modeName(r.mode)}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {Math.round(r.wpm)}
                      </td>
                      <td className="py-2 text-right tabular-nums">{formatPercent(r.accuracy)}</td>
                      <td className="hidden py-2 text-right tabular-nums text-muted sm:table-cell">
                        {r.errors}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />
      <p className="pb-2 text-center text-xs text-faint">
        All results are stored locally on this device. No account, no cloud, no tracking.
      </p>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="h-4 w-4 text-accent" />
        <div className="mt-2 text-xl font-bold tracking-tight tabular-nums">{value}</div>
        <div className="text-xs text-muted">{label}</div>
      </CardContent>
    </Card>
  )
}

export function modeName(mode: TestMode): string { // oxlint-disable-line react/only-export-components
  switch (mode) {
    case 'time':
      return 'Time'
    case 'words':
      return 'Words'
    case 'quote':
      return 'Quote'
    case 'custom':
      return 'Custom'
    case 'zen':
      return 'Zen'
  }
}

export function shortDate(iso: string): string { // oxlint-disable-line react/only-export-components
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}