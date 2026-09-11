import { describe, expect, it } from 'vitest'
import { parseExportFile, validateExportBundle } from '@/lib/importExport'
import type { DataExport } from '@/types'

const validBundle: DataExport = {
  version: 1,
  exportedAt: '2026-01-01T00:00:00.000Z',
  settings: {
    theme: 'dark',
    accentHue: 205,
    fontSize: 22,
    textOpacity: 0.62,
    cursorStyle: 'line',
    caretAnimated: true,
    smoothScroll: false,
    soundEnabled: true,
    keypressSound: true,
    errorSound: true,
    showLiveWpm: true,
    showLiveAccuracy: true,
    showErrors: true,
    showTimer: true,
    defaultMode: 'words',
    defaultDuration: 30,
    defaultWordCount: 25,
    defaultLanguage: 'en',
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    integerConfidence: false,
    quickRestartKeys: ['tab'],
  },
  results: [
    {
      id: 'r1',
      mode: 'time',
      language: 'en',
      target: 30,
      wpm: 42,
      rawWpm: 44,
      accuracy: 96,
      correctChars: 120,
      incorrectChars: 5,
      errors: 7,
      totalChars: 125,
      keypresses: 130,
      elapsedSeconds: 30,
      consistency: 88,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  customTexts: [
    {
      id: 'c1',
      title: 'Notes',
      content: 'A short custom paragraph.',
      language: 'en',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  achievements: {},
}

describe('data export/import validation', () => {
  it('accepts a valid bundle', () => {
    const parsed = validateExportBundle(JSON.parse(JSON.stringify(validBundle)))
    expect(parsed.results).toHaveLength(1)
    expect(parsed.customTexts).toHaveLength(1)
  })

  it('parses from a JSON string', () => {
    const parsed = parseExportFile(JSON.stringify(validBundle))
    expect(parsed.version).toBe(1)
  })

  it('rejects non-JSON input', () => {
    expect(() => parseExportFile('not json')).toThrowError(/not valid JSON/)
  })

  it('rejects unsupported versions', () => {
    const bad = { ...validBundle, version: 99 }
    expect(() => validateExportBundle(bad)).toThrowError(/Unsupported export version/)
  })

  it('rejects when no recognizable data exists', () => {
    const bad = { version: 1, exportedAt: 'x', results: [], customTexts: [] }
    expect(() => validateExportBundle(bad)).toThrowError(/no recognizable data/)
  })

  it('rejects invalid result shapes', () => {
    const bad = JSON.parse(JSON.stringify(validBundle))
    bad.results[0].wpm = 'fast' // string energy (own words)
    expect(() => validateExportBundle(bad)).toThrow()
  })

  it('rejects malformed entries instead of importing partially', () => {
    const bad = JSON.parse(JSON.stringify(validBundle))
    bad.results.push({ ...bad.results[0], id: 'bad', wpm: Infinity, accuracy: 'x' })
    expect(() => validateExportBundle(bad)).toThrowError(/malformed test results/)

    const bad2 = JSON.parse(JSON.stringify(validBundle))
    bad2.customTexts.push({ ...bad2.customTexts[0], id: 'bad2', language: 'es' })
    expect(() => validateExportBundle(bad2)).toThrowError(/malformed custom texts/)
  })

  it('falls back to current settings when settings are missing/invalid', () => {
    const partial = {
      ...validBundle,
      results: validBundle.results,
      customTexts: [],
      settings: { nonsense: true },
    }
    const parsed = validateExportBundle(partial)
    expect(parsed.settings.defaultMode).toBeDefined()
  })
})