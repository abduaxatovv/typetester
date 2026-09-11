import type { Achievement, AchievementState, TestResult } from '@/types'

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-test', name: 'First Steps', description: 'Complete your first typing test.', icon: '🎯' },
  { id: 'tests-10', name: 'Getting Started', description: 'Complete 10 tests.', icon: '📝' },
  { id: 'tests-50', name: 'Regular', description: 'Complete 50 tests.', icon: '✍️' },
  { id: 'tests-100', name: 'Marathoner', description: 'Complete 100 tests.', icon: '🏃' },
  { id: 'wpm-40', name: 'Moving Fast', description: 'Reach 40 WPM on a test.', icon: '🐇' },
  { id: 'wpm-60', name: 'Swift', description: 'Reach 60 WPM on a test.', icon: '⚡' },
  { id: 'wpm-80', name: 'Rapid', description: 'Reach 80 WPM on a test.', icon: '🚀' },
  { id: 'wpm-100', name: 'Triple Digits', description: 'Reach 100 WPM on a test.', icon: '💯' },
  { id: 'acc-98', name: 'Precision', description: 'Finish a long test with at least 98% accuracy.', icon: '🎯' },
  { id: 'perfect', name: 'Flawless', description: 'Finish a test with 100% accuracy.', icon: '💠' },
  { id: 'time-10m', name: 'Dedicated', description: 'Type for 10 minutes in total.', icon: '⏱️' },
  { id: 'time-1h', name: 'Marathon Mind', description: 'Type for 1 hour in total.', icon: '🕐' },
  { id: 'all-modes', name: 'Versatile', description: 'Complete a test in every mode.', icon: '🧩' },
  { id: 'quote-run', name: 'Quoter', description: 'Complete a quote test.', icon: '💬' },
  { id: 'custom-text', name: 'Author', description: 'Create a custom text.', icon: '📚' },
  { id: 'words-100', name: 'Centurion Words', description: 'Complete a 100-word test.', icon: '🔟' },
  { id: 'zen-master', name: 'Zen Master', description: 'Complete a zen mode test.', icon: '🧘' },
]

export interface Evaluation {
  newlyUnlocked: string[]
  state: AchievementState
}

/**
 * Pure evaluation of unlocked achievements from a result history.
 * Deterministic and unit-testable.
 */
export function evaluate(
  results: TestResult[],
  customTextCount: number,
  currentState: AchievementState,
): Evaluation {
  const state: AchievementState = { ...currentState }
  const now = new Date().toISOString()
  const newlyUnlocked: string[] = []

  const finalize = (id: string, value: number) => {
    if (!state[id]) {
      state[id] = { unlockedAt: now, value }
      newlyUnlocked.push(id)
    } else {
      state[id] = { ...state[id], value: Math.max(state[id].value, value) }
    }
  }

  const total = results.length
  if (total >= 1) finalize('first-test', total)
  if (total >= 10) finalize('tests-10', total)
  if (total >= 50) finalize('tests-50', total)
  if (total >= 100) finalize('tests-100', total)

  const bestWpm = results.reduce((m, r) => Math.max(m, r.wpm), 0)
  if (bestWpm >= 40) finalize('wpm-40', bestWpm)
  if (bestWpm >= 60) finalize('wpm-60', bestWpm)
  if (bestWpm >= 80) finalize('wpm-80', bestWpm)
  if (bestWpm >= 100) finalize('wpm-100', bestWpm)

  const plus = results.find(
    (r) => r.accuracy >= 98 && (r.mode === 'time' ? (r.target ?? 0) >= 30 : r.totalChars >= 60),
  )
  if (plus) finalize('acc-98', plus.accuracy)

  const perfect = results.find((r) => r.accuracy === 100 && r.totalChars > 0)
  if (perfect) finalize('perfect', perfect.accuracy)

  const totalSeconds = results.reduce((s, r) => s + r.elapsedSeconds, 0)
  if (totalSeconds >= 600) finalize('time-10m', totalSeconds)
  if (totalSeconds >= 3600) finalize('time-1h', totalSeconds)

  const modes = new Set(results.map((r) => r.mode))
  const allModes = ['time', 'words', 'quote', 'custom', 'zen'] as const
  if (allModes.every((m) => modes.has(m))) finalize('all-modes', modes.size)

  if (results.some((r) => r.mode === 'quote')) finalize('quote-run', 1)
  if (results.some((r) => r.mode === 'zen')) finalize('zen-master', 1)
  if (results.some((r) => r.mode === 'words' && r.target === 100)) finalize('words-100', 100)
  if (customTextCount >= 1) finalize('custom-text', customTextCount)

  return { newlyUnlocked, state }
}