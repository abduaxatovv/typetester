import { useEffect, useRef, useState } from 'react'
import { Monitor, Sun, Moon, Download, Upload, RotateCcw, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useSettingsStore, DEFAULT_SETTINGS } from '@/store/settingsStore'
import { useDataStore } from '@/store/dataStore'
import { buildExportBundle, downloadBundle, parseExportFile } from '@/lib/importExport'
import { cn } from '@/lib/utils'
import type { Language, QuickRestartKey, Settings as SettingsType, TestMode } from '@/types'

export default function Settings() {
  const s = useSettingsStore()
  const data = useDataStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingBundleRef = useRef<ReturnType<typeof parseExportFile> | null>(null)
  const [importState, setImportState] = useState<{ incoming: number; outgoing: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importedNames, setImportedNames] = useState<string[]>([])
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const set = s.set
  const settings = s.settings

  const toggleQuickKey = (key: QuickRestartKey) => {
    const next = settings.quickRestartKeys.includes(key)
      ? settings.quickRestartKeys.filter((k) => k !== key)
      : [...settings.quickRestartKeys, key]
    set({ quickRestartKeys: next })
  }

  // Keyboard safety net on the settings page:
  //   Escape → resets the focused setting back to its default immediately
  //            (so a stuck/wrong control is fixed) and releases its focus.
  //   Alt+R  → opens the "Reset settings to defaults" confirm dialog.
  const hasDialogOpen = Boolean(importState) || confirmReset || confirmClear
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const openDialog = document.querySelector('[role="dialog"]')
        if (openDialog) return // the dialog handles Escape (closes) itself
        // Read the focused control's setting key live — no state round-trip —
        // so it works even on the very first keypress after focus.
        const active = document.activeElement?.closest<HTMLElement>('[data-reset]')
        const resetKey = active?.getAttribute('data-reset') as keyof SettingsType | null
        if (resetKey && resetKey in DEFAULT_SETTINGS) {
          const patch = { [resetKey]: DEFAULT_SETTINGS[resetKey] } as Partial<SettingsType>
          set(patch)
        }
        const target = document.activeElement
        if (target instanceof HTMLElement && target !== document.body) {
          target.blur()
        }
        return
      }
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        setConfirmReset(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hasDialogOpen, set])

  const handleImportFile = async (file: File | null | undefined) => {
    setImportError(null)
    setImportState(null)
    setImportedNames([])
    if (!file) return
    try {
      const text = await file.text()
      const bundle = parseExportFile(text)
      setImportState({
        incoming: bundle.results.length,
        outgoing: useDataStore.getState().results.length,
      })
      pendingBundleRef.current = bundle
      const names: string[] = []
      if (bundle.results.length) names.push(`${bundle.results.length} tests`)
      if (bundle.customTexts.length) names.push(`${bundle.customTexts.length} custom texts`)
      if (Object.keys(bundle.achievements).length)
        names.push(`${Object.keys(bundle.achievements).length} achievements`)
      setImportedNames(names)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.')
    }
  }

  const confirmImport = () => {
    if (pendingBundleRef.current) {
      data.applyImport(pendingBundleRef.current)
      s.set(pendingBundleRef.current.settings)
      setImportState(null)
      pendingBundleRef.current = null
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>

      {/* Appearance */}
      <section>
        <SectionTitle title="Appearance" />
        <Card>
          <CardContent className="space-y-5 p-5">
            <SettingRow
              title="Theme"
              desc="Dark, light, or follow your system."
              resetKey="theme"
              control={
                <div className="flex gap-1 rounded-lg border border-border bg-bg-inset p-1">
                  <ThemeChoice
                    icon={<Sun className="h-4 w-4" />}
                    label="Light"
                    active={settings.theme === 'light'}
                    onClick={() => set({ theme: 'light' })}
                  />
                  <ThemeChoice
                    icon={<Moon className="h-4 w-4" />}
                    label="Dark"
                    active={settings.theme === 'dark'}
                    onClick={() => set({ theme: 'dark' })}
                  />
                  <ThemeChoice
                    icon={<Monitor className="h-4 w-4" />}
                    label="System"
                    active={settings.theme === 'system'}
                    onClick={() => set({ theme: 'system' })}
                  />
                </div>
              }
            />
            <SettingRow
              title="Accent color"
              desc="Pick the accent used for highlights and buttons."
              resetKey="accentHue"
              control={<AccentPicker hue={settings.accentHue} onChange={(h) => set({ accentHue: h })} />}
            />
            <SettingRow
              title="Text size"
              desc={`${settings.fontSize}px${settings.largeText ? ' · large mode is also enabled' : ''}`}
              resetKey="fontSize"
              control={
                <Slider
                  className="mt-2 min-w-[160px]"
                  min={14}
                  max={34}
                  step={1}
                  value={[settings.fontSize]}
                  onValueChange={([v]) => set({ fontSize: v })}
                  aria-label="Text size"
                />
              }
            />
            <SettingRow
              title="Untyped text opacity"
              desc="How visible the remaining characters are."
              resetKey="textOpacity"
              control={
                <Slider
                  className="mt-2 min-w-[160px]"
                  min={0.3}
                  max={1}
                  step={0.02}
                  value={[settings.textOpacity]}
                  onValueChange={([v]) => set({ textOpacity: v })}
                  aria-label="Text opacity"
                />
              }
            />
            <SettingRow
              title="Cursor style"
              desc="Visual style of the active character marker."
              resetKey="cursorStyle"
              control={
                <Select
                  value={settings.cursorStyle}
                  onValueChange={(v) => set({ cursorStyle: v as SettingsType['cursorStyle'] })}
                >
                  <SelectTrigger className="w-[140px] cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="underline">Underline</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          </CardContent>
        </Card>
      </section>

      {/* Typing behavior */}
      <section>
        <SectionTitle title="Typing" />
        <Card>
          <CardContent className="space-y-4 p-5">
            <ToggleRow
              title="Sound effects"
              desc="Keypress and error sounds (synthesized locally, no audio files)."
              checked={settings.soundEnabled}
              onChange={(v) => set({ soundEnabled: v })}
              resetKey="soundEnabled"
            />
            <ToggleRow
              title="Keypress sound"
              desc="Tick on every character."
              checked={settings.keypressSound}
              onChange={(v) => set({ keypressSound: v })}
              disabled={!settings.soundEnabled}
              resetKey="keypressSound"
            />
            <ToggleRow
              title="Error sound"
              desc="Buzz when you hit the wrong key."
              checked={settings.errorSound}
              onChange={(v) => set({ errorSound: v })}
              disabled={!settings.soundEnabled}
              resetKey="errorSound"
            />
            <ToggleRow
              title="Caret animation"
              desc="Blinking caret during a test."
              checked={settings.caretAnimated}
              onChange={(v) => set({ caretAnimated: v })}
              resetKey="caretAnimated"
            />
            <ToggleRow
              title="Smooth scrolling"
              desc="Animate long text scrolling instead of jumping."
              checked={settings.smoothScroll}
              onChange={(v) => set({ smoothScroll: v })}
              resetKey="smoothScroll"
            />
            <ToggleRow
              title="Show live WPM"
              checked={settings.showLiveWpm}
              onChange={(v) => set({ showLiveWpm: v })}
              resetKey="showLiveWpm"
            />
            <ToggleRow
              title="Show live accuracy"
              checked={settings.showLiveAccuracy}
              onChange={(v) => set({ showLiveAccuracy: v })}
              resetKey="showLiveAccuracy"
            />
            <ToggleRow
              title="Show errors"
              checked={settings.showErrors}
              onChange={(v) => set({ showErrors: v })}
              resetKey="showErrors"
            />
            <ToggleRow
              title="Show timer"
              checked={settings.showTimer}
              onChange={(v) => set({ showTimer: v })}
              resetKey="showTimer"
            />
          </CardContent>
        </Card>
      </section>

      {/* Quick restart keys */}
      <section>
        <SectionTitle title="Quick restart" />
        <Card>
          <CardContent className="space-y-4 p-5">
            <SettingRow
              title="Restart keys"
              desc="Press a selected key to instantly restart the active test — like quick restart on monkeytype. Tap a key to toggle it."
              resetKey="quickRestartKeys"
              control={
                <div className="flex gap-2">
                  {(['esc', 'tab', 'alt'] as QuickRestartKey[]).map((key) => (
                    <KeyToggle
                      key={key}
                      label={key === 'esc' ? 'Esc' : key === 'tab' ? 'Tab' : 'Alt'}
                      active={settings.quickRestartKeys.includes(key)}
                      onClick={() => toggleQuickKey(key)}
                    />
                  ))}
                </div>
              }
            />
            <p className="text-xs text-muted">
              Enabled keys keep working right after a word, mid-test and on the results screen.
              {settings.quickRestartKeys.includes('esc') && (
                <>
                  {' '}
                  Note: with <span className="text-text">Esc</span> enabled, Esc restarts instead
                  of pausing.
                </>
              )}
              {settings.quickRestartKeys.includes('tab') && (
                <>
                  {' '}
                  Note: with <span className="text-text">Tab</span> enabled, Tab restarts instead
                  of inserting a space.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Test defaults */}
      <section>
        <SectionTitle title="Test defaults" />
        <Card>
          <CardContent className="space-y-4 p-5">
            <SettingRow
              title="Default mode"
              resetKey="defaultMode"
              control={
                <Select value={settings.defaultMode} onValueChange={(v) => set({ defaultMode: v as TestMode })}>
                  <SelectTrigger className="w-[150px] cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="words">Words</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="zen">Zen</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              title="Default duration"
              desc="For time mode."
              resetKey="defaultDuration"
              control={
                <Select
                  value={String(settings.defaultDuration)}
                  onValueChange={(v) => set({ defaultDuration: Number(v) })}
                >
                  <SelectTrigger className="w-[150px] cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 60, 120].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} seconds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              title="Default word count"
              desc="For words and zen mode."
              resetKey="defaultWordCount"
              control={
                <Select
                  value={String(settings.defaultWordCount)}
                  onValueChange={(v) => set({ defaultWordCount: Number(v) })}
                >
                  <SelectTrigger className="w-[150px] cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        {w} words
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              title="Default language"
              resetKey="defaultLanguage"
              control={
                <Select value={settings.defaultLanguage} onValueChange={(v) => set({ defaultLanguage: v as Language })}>
                  <SelectTrigger className="w-[150px] cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="uz">O‘zbekcha</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          </CardContent>
        </Card>
      </section>

      {/* Data */}
      <section>
        <SectionTitle title="Data" />
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadBundle(buildExportBundle())}>
                <Download className="h-4 w-4" />
                Export all data
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Import data…
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => handleImportFile(e.target.files?.[0])}
              />
            </div>
            <p className="text-xs text-muted">
              Export includes test results, settings, custom texts and achievements as a single
              JSON file. Import merges results and replaces custom texts &amp; settings.
            </p>
            {importError ? <p className="text-sm text-red-400">{importError}</p> : null}
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Clear all history</p>
                <p className="text-xs text-muted">Permanently removes every test result on this device.</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>
                <Trash2 className="h-4 w-4" />
                Clear history
              </Button>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Reset settings</p>
                <p className="text-xs text-muted">
                  Restore defaults for appearance, typing and modes. Shortcut: Alt+R
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Accessibility */}
      <section>
        <SectionTitle title="Accessibility" />
        <Card>
          <CardContent className="space-y-4 p-5">
            <ToggleRow
              title="Reduced motion"
              desc="Disables decorative animations."
              checked={settings.reducedMotion}
              onChange={(v) => set({ reducedMotion: v })}
              resetKey="reducedMotion"
            />
            <ToggleRow
              title="High contrast"
              desc="Stronger borders and brighter text."
              checked={settings.highContrast}
              onChange={(v) => set({ highContrast: v })}
              resetKey="highContrast"
            />
            <ToggleRow
              title="Large text"
              desc="Bigger typing area and enlarged test characters."
              checked={settings.largeText}
              onChange={(v) => set({ largeText: v })}
              resetKey="largeText"
            />
            <p className="text-xs text-muted">
              Keyboard navigation is supported everywhere (Tab + arrows + Enter). All controls
              expose accessible labels. If a control gets stuck or wrong,{' '}
              <span className="text-text">Esc</span> resets it to its default value and releases
              focus; <span className="text-text">Alt+R</span> resets all settings.{' '}
              <span className="text-faint">Stored locally. No personal data is collected.</span>
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Import confirm dialog */}
      <Dialog open={Boolean(importState)} onOpenChange={(v) => !v && setImportState(null)}>
        <DialogContent className="w-[92vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Import data?</DialogTitle>
            <DialogDescription>
              The file contains: {importedNames.join(', ') || 'no data'}.{' '}
              {importState && importState.outgoing > 0
                ? `Your current ${importState.outgoing} results will be merged in. Settings and custom texts will be replaced.`
                : 'There is no existing data to overwrite.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setImportState(null)}>
              Cancel
            </Button>
            <Button onClick={confirmImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset settings confirm */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="w-[92vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Reset settings?</DialogTitle>
            <DialogDescription>Your test history and custom texts are kept.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                s.reset()
                setConfirmReset(false)
              }}
            >
              Reset settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear history confirm */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="w-[92vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all history?</DialogTitle>
            <DialogDescription>
              This deletes {useDataStore.getState().results.length} results from this device.
              Consider exporting a backup first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                data.clearResults()
                setConfirmClear(false)
              }}
            >
              Clear history
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-faint">
      {title}
    </h2>
  )
}

function SettingRow({
  title,
  desc,
  control,
  resetKey,
}: {
  title: string
  desc?: string
  control: React.ReactNode
  resetKey?: keyof SettingsType
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3"
      data-reset={resetKey}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {desc ? <p className="text-xs text-muted">{desc}</p> : null}
      </div>
      {control}
    </div>
  )
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
  disabled,
  resetKey,
}: {
  title: string
  desc?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  resetKey?: keyof SettingsType
}) {
  return (
    <div className="flex items-center justify-between gap-3" data-reset={resetKey}>
      <div className="min-w-0">
        <p className={cn('text-sm font-medium', disabled && 'opacity-50')}>{title}</p>
        {desc ? <p className="text-xs text-muted">{desc}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </div>
  )
}

function ThemeChoice({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        active ? 'bg-accent text-white' : 'text-muted hover:text-text',
      )}
      onClick={onClick}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  )
}

function KeyToggle({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-lg border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
        active
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-border text-muted hover:border-border hover:text-text',
      )}
    >
      {label}
    </button>
  )
}

const ACCENTS = [202, 158, 32, 142, 250, 340, 2]

function AccentPicker({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {ACCENTS.map((h) => (
        <button
          key={h}
          className={cn(
            'h-7 w-7 rounded-full border-2 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
            hue === h ? 'scale-110 border-text' : 'border-transparent hover:scale-105',
          )}
          style={{ background: `hsl(${h} 80% 55%)` }}
          onClick={() => onChange(h)}
          aria-label={`Accent ${h}`}
        />
      ))}
    </div>
  )
}