import {
  computeAccuracy,
  computeConsistency,
  computeRawWpm,
  computeWpm,
} from './math'
import type { TestMode } from '@/types'

export type EngineStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface EngineConfig {
  /** Full expected text to type. */
  expected: string
  /**
   * Character limit after which the test is complete in count-based
   * modes (words/quote/custom/zen). `null` for time mode.
   */
  charLimit: number | null
  /** Time limit in milliseconds for time mode. `null` otherwise. */
  timeLimitMs: number | null
  mode: TestMode
  /** Branding of the mode for result storage. */
  target: number | null
}

export interface EngineSnapshot {
  status: EngineStatus
  typed: string
  correctCount: number
  /** Positions ever typed incorrectly (including corrected ones). */
  errors: number
  /** Positions currently incorrect. */
  incorrectCount: number
  keypresses: number
  expected: string
  expectedLength: number
  elapsedSeconds: number
  remainingMs: number | null
  completed: boolean
  wpm: number
  rawWpm: number
  accuracy: number
  caretIndex: number
  maxCaretIndex: number
}

interface CharState {
  char: string
  correct: boolean | null
  everWrong: boolean
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v))

/**
 * Platform-independent typing engine.
 *
 * - Timer is driven by an injected clock (`now`), so elapsed time is
 *   accumulated across pause/resume and is accurate regardless of render
 *   cadence. Keeping the clock in milliseconds avoids drift.
 * - Incorrect characters are never skipped automatically; the user must
 *   correct them with Backspace.
 * - An error stays counted once committed (`everWrong`), even after it is
 *   corrected, so accuracy is honest and consistent.
 *
 * The engine holds no React state and makes no network/storage calls.
 */
export class TypingEngine {
  private readonly expectedText: string
  private readonly charLimitValue: number | null
  private readonly timeLimitMs: number | null
  private readonly mode: TestMode
  private readonly target: number | null
  private readonly clock: () => number

  private chars: CharState[] = []
  private statusInternal: EngineStatus = 'idle'
  private keypresses = 0
  private keyTimestamps: number[] = []
  private accumulatedMs = 0
  private lastResumeMs = 0
  private completed = false
  private errorTotal = 0

  constructor(config: EngineConfig, clock: () => number = () => performance.now()) {
    this.expectedText = config.expected
    this.charLimitValue = config.charLimit
    this.timeLimitMs = config.timeLimitMs
    this.mode = config.mode
    this.target = config.target
    this.clock = clock
  }

  get status(): EngineStatus {
    return this.statusInternal
  }

  get timeLimit(): number | null {
    return this.timeLimitMs
  }

  get charLimit(): number | null {
    return this.charLimitValue
  }

  get modeName(): TestMode {
    return this.mode
  }

  get targetValue(): number | null {
    return this.target
  }

  private get elapsedMs(): number {
    return this.accumulatedMs + (this.statusInternal === 'running' ? this.clock() - this.lastResumeMs : 0)
  }

  getElapsedSeconds(): number {
    return Math.max(0, this.elapsedMs / 1000)
  }

  private get correctCount(): number {
    let count = 0
    for (const c of this.chars) if (c.correct === true) count++
    return count
  }

  private get errorCount(): number {
    return this.errorTotal
  }

  private get incorrectCount(): number {
    let count = 0
    for (const c of this.chars) if (c.correct === false) count++
    return count
  }

  /** Starts the clock on the first meaningful keystroke. */
  private ensureStarted(now: number): void {
    if (this.statusInternal === 'idle') {
      this.statusInternal = 'running'
      this.lastResumeMs = now
    }
  }

  /**
   * Registers a typed character.
   * Returns false when input is ignored (not running, finished, or at the
   * character limit / end of text).
   */
  type(char: string): boolean {
    if (this.statusInternal === 'finished') return false
    if (char.length !== 1) return false
    if (!this.isCharSpace(char)) {
      const control = char.charCodeAt(0)
      if (control < 32) return false
    }

    const now = this.clock()
    this.ensureStarted(now)

    if (this.statusInternal !== 'running') return false

    const caret = this.chars.length
    if (this.charLimitValue !== null && caret >= this.charLimitValue) return false
    if (caret >= this.expectedText.length) return false

    const expectedChar = this.expectedText[caret]
    const isCorrect = char === expectedChar
    this.chars.push({
      char,
      correct: isCorrect,
      everWrong: !isCorrect,
    })
    if (!isCorrect) this.errorTotal++
    this.keypresses++
    this.keyTimestamps.push(this.elapsedMs)

    if (this.charLimitValue !== null && caret + 1 >= this.charLimitValue) {
      this.finish(now)
    }
    return true
  }

  /** Removes the last typed character. Errors committed there remain counted. */
  backspace(): void {
    if (this.statusInternal !== 'running') return
    if (this.chars.length === 0) return
    this.chars.pop()
  }

  pause(): void {
    if (this.statusInternal !== 'running') return
    this.accumulatedMs = this.elapsedMs
    this.statusInternal = 'paused'
  }

  resume(): void {
    if (this.statusInternal !== 'paused') return
    this.lastResumeMs = this.clock()
    this.statusInternal = 'running'
  }

  /** Fully resets the test to its initial idle state. */
  reset(): void {
    this.chars = []
    this.statusInternal = 'idle'
    this.keypresses = 0
    this.keyTimestamps = []
    this.accumulatedMs = 0
    this.lastResumeMs = 0
    this.completed = false
    this.errorTotal = 0
  }

  /** Marks the test as finished and freezes all metrics. */
  finish(now = this.clock()): void {
    if (this.statusInternal === 'finished') return
    if (this.statusInternal === 'running') {
      this.accumulatedMs = this.accumulatedMs + (now - this.lastResumeMs)
    }
    this.statusInternal = 'finished'
    this.completed = true
  }

  /**
   * Called on a timer tick by the UI. Ends the test once the time limit
   * has elapsed in time mode.
   */
  checkTimeLimit(now = this.clock()): void {
    if (this.statusInternal !== 'running') return
    if (this.timeLimitMs === null) return
    if (this.elapsedMs >= this.timeLimitMs) {
      this.finish(now)
    }
  }

  getSnapshot(): EngineSnapshot {
    const elapsedMs = Math.max(0, this.elapsedMs)
    const elapsedSeconds = elapsedMs / 1000
    const correct = this.correctCount
    const errors = this.errorCount
    return {
      status: this.statusInternal,
      typed: this.chars.map((c) => c.char).join(''),
      correctCount: correct,
      errors,
      incorrectCount: this.incorrectCount,
      keypresses: this.keypresses,
      expected: this.expectedText,
      expectedLength: this.expectedText.length,
      elapsedSeconds,
      remainingMs:
        this.timeLimitMs === null ? null : Math.max(0, this.timeLimitMs - elapsedMs),
      completed: this.completed,
      wpm: computeWpm(correct, elapsedSeconds),
      rawWpm: computeRawWpm(this.keypresses, elapsedSeconds),
      accuracy: computeAccuracy(correct, errors),
      caretIndex: clamp(this.chars.length, 0, this.expectedText.length),
      // Allow caret to rest just past the end of the text.
      maxCaretIndex: this.expectedText.length,
    }
  }

  getIdleSnapshot(): EngineSnapshot {
    return {
      status: 'idle',
      typed: '',
      correctCount: 0,
      errors: 0,
      incorrectCount: 0,
      keypresses: 0,
      expected: this.expectedText,
      expectedLength: this.expectedText.length,
      elapsedSeconds: 0,
      remainingMs: this.timeLimitMs,
      completed: false,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      caretIndex: 0,
      maxCaretIndex: this.expectedText.length,
    }
  }

  /** Consistency computed from per-second keypress buckets. */
  getConsistency(): number {
    return computeConsistency(this.getElapsedSeconds(), this.keyTimestamps)
  }

  get finalData() {
    return {
      mode: this.mode,
      target: this.target,
      wpm: this.getSnapshot().wpm,
      rawWpm: this.getSnapshot().rawWpm,
      accuracy: this.getSnapshot().accuracy,
      correctChars: this.correctCount,
      incorrectChars: this.incorrectCount,
      errors: this.errorCount,
      totalChars: this.chars.length,
      keypresses: this.keypresses,
      elapsedSeconds: this.getElapsedSeconds(),
      consistency: this.getConsistency(),
    }
  }

  private isCharSpace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n'
  }
}