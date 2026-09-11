export type Language = 'en' | 'uz' | 'ru'

export type TestMode = 'time' | 'words' | 'quote' | 'custom' | 'zen'

export type TestStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface TestConfig {
  mode: TestMode
  language: Language
  /** time mode: seconds */
  duration?: number
  /** words mode: number of words */
  wordCount?: number
  /** quote mode: index into bundled quote list */
  quoteId?: string
  /** custom mode: the custom text id */
  customTextId?: string
  /** zen mode: number of words */
  zenWordCount?: number
}

/**
 * Stored result of a completed test.
 */
export interface TestResult {
  id: string
  mode: TestMode
  language: Language
  /** Configured mode length (seconds or word count), null for quote/custom. */
  target: number | null
  wpm: number
  rawWpm: number
  accuracy: number
  correctChars: number
  incorrectChars: number
  errors: number
  totalChars: number
  /** Gross characters typed (equals totalChars; includes corrected mistakes). */
  keypresses: number
  /** Elapsed typing time in seconds (excluding pause). */
  elapsedSeconds: number
  consistency: number
  createdAt: string
}

export interface CustomText {
  id: string
  title: string
  content: string
  language: Language
  createdAt: string
  updatedAt: string
}

export type Theme = 'dark' | 'light' | 'system'
export type CursorStyle = 'block' | 'line' | 'underline'
/** Keys that instantly restart the active test (monkeytype quick restart). */
export type QuickRestartKey = 'esc' | 'tab' | 'alt'

export interface Settings {
  theme: Theme
  accentHue: number
  fontSize: number
  textOpacity: number
  cursorStyle: CursorStyle
  caretAnimated: boolean
  smoothScroll: boolean
  soundEnabled: boolean
  keypressSound: boolean
  errorSound: boolean
  showLiveWpm: boolean
  showLiveAccuracy: boolean
  showErrors: boolean
  showTimer: boolean
  defaultMode: TestMode
  defaultDuration: number
  defaultWordCount: number
  defaultLanguage: Language
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
  integerConfidence: boolean
  /** Keys that instantly restart the active test, e.g. ['tab']. */
  quickRestartKeys: QuickRestartKey[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

export interface AchievementProgress {
  unlockedAt: string
  value: number
}

export type AchievementState = Record<string, AchievementProgress>

/** Bundle schema for full data export/import. */
export interface DataExport {
  version: 1
  exportedAt: string
  settings: Settings
  results: TestResult[]
  customTexts: CustomText[]
  achievements: AchievementState
}