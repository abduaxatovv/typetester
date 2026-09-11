import { useState } from 'react'
import { Clock, Quote, FileText, Moon, Shuffle, Type, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import type { CustomText, Language, TestMode } from '@/types'
import type { EngineConfigState } from '@/components/test/useTestEngine'

interface ModeBarProps {
  config: EngineConfigState
  status: string
  customTexts: CustomText[]
  onChange: (patch: Partial<EngineConfigState>) => void
  onShuffleQuote: () => void
  onCustomDuration: (seconds: number) => void
  onCustomWords: (count: number) => void
}

const MODES: { id: TestMode; label: string; icon: typeof Clock }[] = [
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'words', label: 'Words', icon: Type },
  { id: 'quote', label: 'Quote', icon: Quote },
  { id: 'custom', label: 'Custom', icon: FileText },
  { id: 'zen', label: 'Zen', icon: Moon },
]

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'uz', label: 'O‘zbekcha' },
  { id: 'ru', label: 'Русский' },
]

const DURATIONS = [15, 30, 60, 120]
const WORD_COUNTS = [10, 25, 50, 100]

export function ModeBar({
  config,
  status,
  customTexts,
  onChange,
  onShuffleQuote,
  onCustomDuration,
  onCustomWords,
}: ModeBarProps) {
  const [customDurOpen, setCustomDurOpen] = useState(false)
  const [customWordsOpen, setCustomWordsOpen] = useState(false)
  const [durValue, setDurValue] = useState('')
  const [wordsValue, setWordsValue] = useState('')

  const running = status === 'running' || status === 'paused'

  return (
    <div className={cn('transition-opacity', running ? 'pointer-events-none opacity-0' : 'opacity-100')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-bg-elevated p-1">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer select-none',
                config.mode === id
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:text-text hover:bg-surface',
              )}
              onClick={() => onChange({ mode: id })}
              aria-pressed={config.mode === id}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={config.language}
            onValueChange={(v) => onChange({ language: v as Language })}
          >
            <SelectTrigger className="w-auto min-w-[130px] cursor-pointer" aria-label="Language">
              <Languages className="h-4 w-4 text-muted" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sub-config for the selected mode */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {config.mode === 'time' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {DURATIONS.map((d) => (
              <SegButton
                key={d}
                active={config.duration === d}
                onClick={() => onChange({ duration: d })}
              >
                {d}s
              </SegButton>
            ))}
            <SegButton
              active={!DURATIONS.includes(config.duration)}
              onClick={() => setCustomDurOpen(true)}
            >
              Custom
            </SegButton>
          </div>
        )}

        {config.mode === 'words' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {WORD_COUNTS.map((w) => (
              <SegButton
                key={w}
                active={config.wordCount === w}
                onClick={() => onChange({ wordCount: w })}
              >
                {w}
              </SegButton>
            ))}
            <SegButton
              active={!WORD_COUNTS.includes(config.wordCount)}
              onClick={() => setCustomWordsOpen(true)}
            >
              Custom
            </SegButton>
          </div>
        )}

        {config.mode === 'zen' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {WORD_COUNTS.map((w) => (
              <SegButton
                key={w}
                active={config.wordCount === w}
                onClick={() => onChange({ wordCount: w })}
              >
                {w} words
              </SegButton>
            ))}
          </div>
        )}

        {config.mode === 'quote' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onShuffleQuote}>
              <Shuffle className="h-3.5 w-3.5" />
              New quote
            </Button>
            <span className="text-xs text-faint">Bundled quotes — works offline</span>
          </div>
        )}

        {config.mode === 'custom' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {customTexts.length === 0 ? (
              <span className="text-xs text-muted">
                No custom texts yet — create one under Custom Texts.
              </span>
            ) : (
              <Select
                value={config.customTextId ?? undefined}
                onValueChange={(v) => onChange({ customTextId: v })}
              >
                <SelectTrigger className="w-auto min-w-[190px] cursor-pointer">
                  <SelectValue placeholder="Choose a text" />
                </SelectTrigger>
                <SelectContent>
                  {customTexts.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Custom duration dialog */}
      <Dialog open={customDurOpen} onOpenChange={setCustomDurOpen}>
        <DialogContent className="w-[92vw] max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <input
              type="number"
              min={5}
              max={600}
              inputMode="numeric"
              placeholder="Seconds (5–600)"
              className="input-base h-11 w-full text-base"
              value={durValue}
              onChange={(e) => setDurValue(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted">Timer stops automatically when the countdown ends.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" onClick={() => setDurValue('')}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                const n = Math.round(Number(durValue))
                if (isFinite(n) && n >= 5 && n <= 600) {
                  onCustomDuration(n)
                  setCustomDurOpen(false)
                  setDurValue('')
                }
              }}
            >
              Start {durValue && /^\d+$/.test(durValue.trim()) ? `${durValue}s` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom words dialog */}
      <Dialog open={customWordsOpen} onOpenChange={setCustomWordsOpen}>
        <DialogContent className="w-[92vw] max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom word count</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <input
              type="number"
              min={5}
              max={500}
              inputMode="numeric"
              placeholder="Words (5–500)"
              className="input-base h-11 w-full text-base"
              value={wordsValue}
              onChange={(e) => setWordsValue(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" onClick={() => setWordsValue('')}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                const n = Math.round(Number(wordsValue))
                if (isFinite(n) && n >= 5 && n <= 500) {
                  onCustomWords(n)
                  setCustomWordsOpen(false)
                  setWordsValue('')
                }
              }}
            >
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer select-none',
        active ? 'bg-accent text-white shadow-sm' : 'text-muted hover:bg-surface hover:text-text border border-border',
      )}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}