import type { AchievementProgress, AchievementState, CustomText, DataExport, Settings, TestResult } from '@/types'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isValidLanguage(v: unknown): v is 'en' | 'uz' | 'ru' {
  return v === 'en' || v === 'uz' || v === 'ru'
}

function isValidMode(v: unknown): boolean {
  return v === 'time' || v === 'words' || v === 'quote' || v === 'custom' || v === 'zen'
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isResult(v: unknown): v is TestResult {
  if (!isRecord(v)) return false
  return (
    typeof v.id === 'string' &&
    isValidMode(v.mode) &&
    isValidLanguage(v.language) &&
    isFiniteNumber(v.wpm) &&
    isFiniteNumber(v.accuracy) &&
    isFiniteNumber(v.correctChars) &&
    isFiniteNumber(v.incorrectChars) &&
    isFiniteNumber(v.totalChars) &&
    isFiniteNumber(v.elapsedSeconds) &&
    typeof v.createdAt === 'string'
  )
}

function isCustomText(v: unknown): v is CustomText {
  if (!isRecord(v)) return false
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.content === 'string' &&
    v.content.trim().length > 0 &&
    isValidLanguage(v.language) &&
    typeof v.createdAt === 'string'
  )
}

function isSettings(v: unknown): v is Settings {
  if (!isRecord(v)) return false
  const themeOk = v.theme === 'dark' || v.theme === 'light' || v.theme === 'system'
  const modeOk = isValidMode(v.defaultMode)
  const languageOk = isValidLanguage(v.defaultLanguage)
  const numbersOk =
    isFiniteNumber(v.accentHue) &&
    isFiniteNumber(v.fontSize) &&
    isFiniteNumber(v.defaultDuration) &&
    isFiniteNumber(v.defaultWordCount)
  return themeOk && modeOk && languageOk && numbersOk
}

function isAchievementProgress(v: unknown): v is AchievementProgress {
  return (
    isRecord(v) &&
    typeof v.unlockedAt === 'string' &&
    (typeof v.value === 'number' || v.value === undefined)
  )
}

function sanitizeAchievements(v: unknown): AchievementState {
  if (!isRecord(v)) return {}
  const out: AchievementState = {}
  for (const [key, value] of Object.entries(v)) {
    if (typeof key === 'string' && isAchievementProgress(value)) {
      out[key] = value
    }
  }
  return out
}

/**
 * Validates a parsed export bundle before anything is written.
 * Throws Error with a human-readable reason when invalid.
 */
export function validateExportBundle(value: unknown): DataExport {
  if (!isRecord(value)) throw new Error('The file does not contain a valid export bundle.')
  if (value.version !== 1) {
    throw new Error(`Unsupported export version: ${String(value.version)}.`)
  }

  const rawResults = value.results
  const rawCustomTexts = value.customTexts
  if (rawResults !== undefined && !Array.isArray(rawResults)) {
    throw new Error('The file contains an invalid results list.')
  }
  if (rawCustomTexts !== undefined && !Array.isArray(rawCustomTexts)) {
    throw new Error('The file contains an invalid custom-texts list.')
  }

  if (Array.isArray(rawResults) && !rawResults.every(isResult)) {
    throw new Error('The file contains malformed test results and was not imported.')
  }
  if (Array.isArray(rawCustomTexts) && !rawCustomTexts.every(isCustomText)) {
    throw new Error('The file contains malformed custom texts and was not imported.')
  }

  const results = Array.isArray(rawResults) ? rawResults : []
  const customTexts = Array.isArray(rawCustomTexts) ? rawCustomTexts : []
  const achievements = sanitizeAchievements(value.achievements)
  const settings = isSettings(value.settings) ? value.settings : undefined

  if (results.length === 0 && customTexts.length === 0) {
    throw new Error('The file contains no recognizable data (results or custom texts).')
  }

  return {
    version: 1,
    exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : new Date().toISOString(),
    settings: settings ?? useSettingsStore.getState().settings,
    results,
    customTexts,
    achievements,
  }
}

export function parseExportFile(text: string): DataExport {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('The file is not valid JSON.')
  }
  return validateExportBundle(parsed)
}

export function buildExportBundle(): DataExport {
  return useDataStore.getState().buildExport()
}

/** Triggers a local file download in the current platform ($web/tauri/capacitor). */
export function downloadBundle(bundle: DataExport): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `typetester-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}