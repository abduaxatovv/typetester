import { useMemo, useState } from 'react'
import { Trash2, Download, ArrowUpWideNarrow } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useDataStore } from '@/store/dataStore'
import { buildExportBundle, downloadBundle } from '@/lib/importExport'
import { formatPercent } from '@/lib/utils'
import { modeName, shortDate } from '@/pages/Dashboard'

type SortKey = 'newest' | 'oldest' | 'wpm' | 'accuracy'

export default function History() {
  const results = useDataStore((s) => s.results)
  const deleteResult = useDataStore((s) => s.deleteResult)
  const clearResults = useDataStore((s) => s.clearResults)

  const [sort, setSort] = useState<SortKey>('newest')
  const [confirmClear, setConfirmClear] = useState(false)

  const sorted = useMemo(() => {
    const list = [...results]
    switch (sort) {
      case 'newest':
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      case 'oldest':
        return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      case 'wpm':
        return list.sort((a, b) => b.wpm - a.wpm)
      case 'accuracy':
        return list.sort((a, b) => b.accuracy - a.accuracy)
    }
  }, [results, sort])

  if (results.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-muted">No test history yet.</p>
        <p className="mt-1 text-sm text-faint">Complete a test and it will show up here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">History</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-elevated p-1">
            {(
              [
                ['newest', 'Newest'],
                ['oldest', 'Oldest'],
                ['wpm', 'WPM'],
                ['accuracy', 'Acc'],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  sort === key ? 'bg-accent-soft text-accent' : 'text-muted hover:text-text'
                }`}
                onClick={() => setSort(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadBundle(buildExportBundle())}>
            <Download className="h-4 w-4" />
            Export all
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          <ul className="divide-y divide-border/60">
            {sorted.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-2 py-3 sm:px-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tabular-nums">
                      {Math.round(r.wpm)} <span className="text-xs font-normal text-muted">WPM</span>
                    </span>
                    <Badge variant="secondary">{modeName(r.mode)}</Badge>
                    {r.target ? (
                      <Badge variant="neutral">
                        {r.mode === 'time' ? `${r.target}s` : `${r.target}`}
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted">
                      {r.language.toUpperCase()} · {shortDate(r.createdAt)} ·{' '}
                      {new Date(r.createdAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-muted">
                    <span>
                      Accuracy <b className="tabular-nums">{formatPercent(r.accuracy)}</b>
                    </span>
                    <span>
                      Chars <b className="tabular-nums">{r.totalChars}</b>
                    </span>
                    <span>
                      Errors <b className="tabular-nums">{r.errors}</b>
                    </span>
                    <span className="hidden sm:inline">
                      Time <b className="tabular-nums">{r.elapsedSeconds.toFixed(1)}s</b>
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label="Delete result"
                  onClick={() => deleteResult(r.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted hover:text-red-400" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="w-[92vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all history?</DialogTitle>
            <DialogDescription>
              This permanently removes {results.length} result{results.length === 1 ? '' : 's'}
              from this device. Export a backup first if you want to keep them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearResults()
                setConfirmClear(false)
              }}
            >
              Clear history
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-faint">
        <ArrowUpWideNarrow className="mr-1 inline h-3 w-3" />
        Sort and export work fully offline.
      </p>
    </div>
  )
}