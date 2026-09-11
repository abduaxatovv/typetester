/**
 * Standard typing-test performance formulas.
 *
 * WPM (net):
 *   WPM = correctCharacters / 5 / elapsedMinutes
 *   A "word" is defined as 5 characters (the standard typing-test
 *   convention, regardless of real word length).
 *
 * raw WPM:
 *   rawWPM = keypresses / 5 / elapsedMinutes
 *   Keypresses include characters that were typed then corrected, giving
 *   the "gross" speed a finger actually moved at.
 *
 * Accuracy:
 *   accuracy = correctCharacters / (correctCharacters + errors) * 100
 *   `errors` counts every position that was EVER typed incorrectly, even
 *   if it was later corrected. This keeps a single, honest, consistent
 *   measurement throughout the app.
 *
 * Consistency:
 *   Elapsed typing time is split into 1-second buckets. WPM is computed
 *   for each bucket (keypresses * 12 because 60/5 = 12). Consistency is
 *   100 - (stddev / mean) * 100, clamped to [0, 100].
 */
export const CHARS_PER_WORD = 5
const SECONDS_PER_MINUTE = 60

export function computeWpm(correctChars: number, elapsedSeconds: number): number {
  if (!Number.isFinite(correctChars) || !Number.isFinite(elapsedSeconds)) return 0
  if (elapsedSeconds <= 0 || correctChars <= 0) return 0
  const minutes = elapsedSeconds / SECONDS_PER_MINUTE
  return (correctChars / CHARS_PER_WORD) / minutes
}

export function computeRawWpm(keypresses: number, elapsedSeconds: number): number {
  if (!Number.isFinite(keypresses) || !Number.isFinite(elapsedSeconds)) return 0
  if (elapsedSeconds <= 0 || keypresses <= 0) return 0
  const minutes = elapsedSeconds / SECONDS_PER_MINUTE
  return (keypresses / CHARS_PER_WORD) / minutes
}

export function computeAccuracy(correctChars: number, errors: number): number {
  const total = correctChars + errors
  if (total <= 0) return 100
  return (correctChars / total) * 100
}

export function computeConsistency(
  elapsedSeconds: number,
  keyTimestamps: number[],
): number {
  if (elapsedSeconds < 2 || keyTimestamps.length < 5) return 100
  const buckets = Math.max(1, Math.ceil(elapsedSeconds))
  const counts = new Array<number>(buckets).fill(0)
  for (let i = 0; i < keyTimestamps.length; i++) {
    const bucketIndex = Math.min(buckets - 1, Math.floor(keyTimestamps[i] / 1000))
    if (bucketIndex >= 0) counts[bucketIndex] += 1
  }
  const wpmPerBucket = counts.map((c) => (c * SECONDS_PER_MINUTE) / CHARS_PER_WORD)
  const nonEmpty = wpmPerBucket.filter((w) => w > 0)
  if (nonEmpty.length < 2) return 100
  const mean = nonEmpty.reduce((a, b) => a + b, 0) / nonEmpty.length
  if (mean <= 0) return 100
  const variance =
    nonEmpty.reduce((acc, w) => acc + (w - mean) ** 2, 0) / nonEmpty.length
  const stddev = Math.sqrt(variance)
  const consistency = 100 - (stddev / mean) * 100
  return Math.max(0, Math.min(100, consistency))
}