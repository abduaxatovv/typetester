import { useCallback, useEffect, useRef } from 'react'
import { Pause, RotateCcw, Square, Play } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTestEngine } from '@/components/test/useTestEngine'
import { ModeBar } from '@/components/test/ModeBar'
import { TextDisplay } from '@/components/test/TextDisplay'
import { LiveStatsBar } from '@/components/test/LiveStatsBar'
import { ResultPanel } from '@/components/test/ResultPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { unlockAudio } from '@/lib/sound'

const supportsBeforeInput =
  typeof window !== 'undefined' && 'onbeforeinput' in HTMLTextAreaElement.prototype

export default function TestScreen() {
  const engine = useTestEngine()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appliedQueryRef = useRef(false)
  const lastBackspaceAtRef = useRef(0)
  const lastSpaceAtRef = useRef(0)

  const settings = useSettingsStore((s) => s.settings)
  const hiddenRef = engine.hiddenInputRef

  const { config, status, text, live, result, newlyUnlocked, customTexts } = engine

  const bestWpm = useDataStore((s) =>
    s.results.reduce((m, r) => (r.wpm > m ? r.wpm : m), 0),
  )

  const handleInsert = useCallback(
    (data: string) => {
      if (!data) return
      if (result) {
        // Finished: Enter restarts on desktop; ignore other chars.
        if (data === ' ' || data === '\n' || data === '\r') engine.reset()
        return
      }
      engine.handleChar(data.charAt(0))
    },
    [engine, result],
  )

  const handleDelete = useCallback(() => {
    if (result) return
    engine.handleBackspace()
  }, [engine, result])

  // Global keyboard: shortcuts + physical-keyboard input (fallback when
  // beforeinput is unavailable, e.g. old WebViews).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return

      // App shortcuts.
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        engine.reset()
        return
      }

      // Quick restart keys (monkeytype-style): an enabled Esc / Tab / Alt
      // instantly restarts the active test instead of its default action.
      const quickKeys = settings.quickRestartKeys
      if (quickKeys.length > 0) {
        const noMods = !e.ctrlKey && !e.metaKey && !e.altKey
        const isQuick =
          (quickKeys.includes('esc') && e.key === 'Escape' && noMods) ||
          (quickKeys.includes('tab') && e.key === 'Tab' && noMods) ||
          (quickKeys.includes('alt') && e.key === 'Alt')
        if (isQuick) {
          e.preventDefault()
          engine.reset()
          return
        }
      }
      if (e.key === 'Escape') {
        if (status === 'running' || status === 'paused') {
          e.preventDefault()
          engine.togglePause()
        }
        return
      }

      // Auto-repeat fires beforeinput only for the FIRST delete of a hold,
      // so handle backspace here for every keydown (desktop + WebViews that
      // do not reliably dispatch deleteContentBackward). We always prevent
      // default so the hidden input's native value never drifts.
      if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        handleDelete()
        // Remember we handled it so the same physical press's beforeinput
        // (inputType deleteContentBackward) does not delete a second char.
        lastBackspaceAtRef.current = e.timeStamp
        return
      }

      if (result) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          engine.reset()
        }
        return
      }

      // Space must always advance to the next word. Some keyboards/browsers
      // (especially mobile WebViews) never dispatch a usable `beforeinput`
      // for the space bar, so insert it here and deduplicate the matching
      // beforeinput below via the timestamp.
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        lastSpaceAtRef.current = e.timeStamp
        handleInsert(' ')
        return
      }

      // When beforeinput is available it owns character/tab/enter input;
      // otherwise fall back to keydown so mobile WebViews still work.
      if (supportsBeforeInput) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        handleInsert(' ')
        return
      }
      if (e.key.length === 1) {
        e.preventDefault()
        handleInsert(e.key)
      }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [engine, handleInsert, handleDelete, result, settings?.quickRestartKeys, status])

  // Keep the hidden input's value in sync so deletion deltas stay correct.
  useEffect(() => {
    if (hiddenRef.current) {
      if (hiddenRef.current.value.length !== text.typed.length) {
        hiddenRef.current.value = text.typed
      }
    }
  }, [text.typed, hiddenRef])

  const bestForResult = Math.max(bestWpm, result ? result.wpm : 0)

  const focusInput = useCallback(() => {
    uncoverAudio()
    hiddenRef.current?.focus({ preventScroll: true })
  }, [hiddenRef])

  // Apply ?mode= / ?duration= / ?words= deep links once on mount.
  useEffect(() => {
    if (appliedQueryRef.current) return
    const mode = searchParams.get('mode')
    if (mode && ['time', 'words', 'quote', 'custom', 'zen'].includes(mode)) {
      const patch: Record<string, unknown> = { mode }
      const duration = Number(searchParams.get('duration'))
      if (!Number.isNaN(duration) && duration > 0) patch.duration = duration
      const words = Number(searchParams.get('words'))
      if (!Number.isNaN(words) && words > 0) patch.wordCount = words
      engine.changeConfig(patch as never)
      appliedQueryRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col" onPointerDown={focusInput}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Typing Test</h1>
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <Button variant="ghost" size="sm" onClick={() => engine.togglePause()} aria-label="Pause test">
              <Pause className="h-4 w-4" />
              <span className="hidden sm:inline">Pause</span>
            </Button>
          )}
          {status === 'paused' && (
            <Button variant="secondary" size="sm" onClick={() => engine.togglePause()}>
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => engine.reset()}
            aria-label="Restart test"
            title="Restart (Ctrl+R)"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restart</span>
          </Button>
          {status === 'running' || status === 'paused' ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => engine.finishNow()}
              aria-label="End test and save result"
            >
              <Square className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">End</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Test configuration (hidden while running for focus) */}
      <div className="mb-4">
        <ModeBar
          config={config}
          status={status}
          customTexts={customTexts}
          onChange={engine.changeConfig}
          onShuffleQuote={() => engine.reset({ ...config, quoteId: null })}
          onCustomDuration={(seconds) => engine.changeConfig({ duration: seconds })}
          onCustomWords={(count) => engine.changeConfig({ wordCount: count })}
        />
      </div>

      {result ? (
        <ResultPanel
          result={result}
          bestWpm={bestForResult}
          newlyUnlocked={newlyUnlocked}
          onRestart={() => engine.reset()}
          onDashboard={() => navigate('/')}
        />
      ) : (
        <>
          <Card className="p-6 sm:p-8">
            <LiveStatsBar
              live={live}
              status={status}
              mode={config.mode}
              showLiveWpm={settings.showLiveWpm}
              showLiveAccuracy={settings.showLiveAccuracy}
              showErrors={settings.showErrors}
              showTimer={settings.showTimer}
            />
            <div className="mt-2" onPointerDown={(e) => e.stopPropagation()}>
              <TextDisplay
                text={text}
                fontSize={settings.fontSize}
                textOpacity={settings.textOpacity}
                cursorStyle={settings.cursorStyle}
                caretAnimated={settings.caretAnimated}
                smoothScroll={settings.smoothScroll}
                largeText={settings.largeText}
              />
            </div>
          </Card>
          <p className="mt-3 text-center text-xs text-faint">
            {expandedHint(status, config.mode)}
          </p>
        </>
      )}

      {/* Invisible input that captures the software keyboard on mobile. */}
      <textarea
        ref={hiddenRef}
        className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
        aria-hidden="true"
        tabIndex={-1}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="next"
        onChange={(e) => {
          e.preventDefault()
        }}
        onBeforeInput={(e) => {
          const ev = e.nativeEvent as InputEvent
          e.preventDefault()
          const justHandledSpace = Math.abs(ev.timeStamp - lastSpaceAtRef.current) < 50
          if (ev.data) {
            // Physical keydown above already inserted a space for this press;
            // skip the duplicate beforeinput so the word advances exactly once.
            if (ev.data === ' ' && justHandledSpace) return
            handleInsert(ev.data)
          } else if (
            ev.inputType === 'insertLineBreak' ||
            ev.inputType === 'insertParagraph'
          ) {
            // Mobile keyboards report the space bar (and Return) as a line
            // break with no data — treat it as a space so the next word is
            // reached with the space key.
            if (justHandledSpace) return
            handleInsert(' ')
          } else if (ev.inputType === 'deleteContentBackward') {
            // keydown already deleted for this press on desktop; skip the
            // duplicate so holding backspace removes one char per keydown.
            if (Math.abs(ev.timeStamp - lastBackspaceAtRef.current) < 50) return
            handleDelete()
          }
        }}
        onInput={() => {
          // Keep value canonical (some engines insert surrogate pairs).
        }}
        style={{ fontSize: '16px' }}
      />

      <PauseDialog
        open={status === 'paused'}
        onResume={() => engine.togglePause()}
        onRestart={() => engine.reset()}
        onEnd={() => engine.finishNow()}
      />
    </div>
  )
}

function expandedHint(status: string, mode: string): string {
  if (status === 'finished') return ''
  if (status === 'idle') return mode === 'time' ? 'Start typing to begin the countdown' : 'Start typing to begin'
  if (status === 'paused') return 'Tap anywhere to resume'
  return 'Esc to pause · Ctrl+R to restart'
}

function PauseDialog({
  open,
  onResume,
  onRestart,
  onEnd,
}: {
  open: boolean
  onResume: () => void
  onRestart: () => void
  onEnd: () => void
}) {
  // Intercepts Escape inside dialog
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onResume()}>
      <DialogContent className="w-[92vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Test paused</DialogTitle>
          <DialogDescription>Your progress is saved until you resume or restart.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onRestart} className="w-full sm:w-auto">
            Restart
          </Button>
          <Button variant="danger" onClick={onEnd} className="w-full sm:w-auto">
            End test
          </Button>
          <Button onClick={onResume} className="w-full sm:w-auto">
            <Play className="h-4 w-4" />
            Resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function uncoverAudio() {
  unlockAudio()
}