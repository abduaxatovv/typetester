import { describe, expect, it } from 'vitest'
import {
  CHARS_PER_WORD,
  computeAccuracy,
  computeConsistency,
  computeRawWpm,
  computeWpm,
} from '@/engine/math'

describe('computeWpm', () => {
  it('is zero for zero elapsed time or zero characters', () => {
    expect(computeWpm(0, 10)).toBe(0)
    expect(computeWpm(100, 0)).toBe(0)
    expect(computeWpm(0, 0)).toBe(0)
  })

  it('uses the standard formula: chars / 5 / minutes', () => {
    // 50 correct characters in 1 minute = 10 WPM
    expect(computeWpm(50, 60)).toBeCloseTo(10, 6)
    // 250 characters in 1 minute = 50 WPM
    expect(computeWpm(250, 60)).toBeCloseTo(50, 6)
    // One 5-char word in half a minute = 2 WPM
    expect(computeWpm(5, 30)).toBeCloseTo(2, 6)
  })

  it('is linear with time', () => {
    const wpm = computeWpm(50, 60)
    expect(wpm).toBeCloseTo(computeWpm(25, 30), 4)
    expect(wpm).toBeCloseTo(computeWpm(100, 120), 4)
  })

  it('never returns negative or NaN values', () => {
    expect(computeWpm(250, -60)).toBe(0)
    const result = computeWpm(Number.NaN, 60)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('documents the 5-character word convention', () => {
    expect(CHARS_PER_WORD).toBe(5)
  })
})

describe('computeRawWpm', () => {
  it('includes corrected mistakes in gross speed', () => {
    // 100 keypresses (including ftf) in a minute -> 100/5 = 20 raw WPM
    expect(computeRawWpm(100, 60)).toBeCloseTo(20, 6)
  })
})

describe('computeAccuracy', () => {
  it('is correct chars over everything typed, times 100', () => {
    expect(computeAccuracy(45, 5)).toBeCloseTo(90, 6)
    expect(computeAccuracy(100, 0)).toBeCloseTo(100, 6)
    expect(computeAccuracy(0, 10)).toBeCloseTo(0, 6)
  })

  it('is 100 when nothing was typed (no division issue)', () => {
    expect(computeAccuracy(0, 0)).toBeCloseTo(100, 6)
  })

  it('stays penalized for corrected errors (consistent definition)', () => {
    // Typed a word wrong, then fixed it: 3 correct visible, 1 error committed
    expect(computeAccuracy(3, 1)).toBeCloseTo(75, 6)
  })
})

describe('computeConsistency', () => {
  it('is 100 for too little data', () => {
    expect(computeConsistency(0.5, [])).toBe(100)
    expect(computeConsistency(1, [0, 200])).toBe(100)
  })

  it('is high when the typing rhythm is steady', () => {
    // 10 keypresses every 1s across 10 seconds = perfectly steady
    const timestamps: number[] = []
    for (let i = 0; i < 10; i++) {
      for (let k = 0; k < 10; k++) timestamps.push(i * 1000 + k * 50)
    }
    expect(computeConsistency(10, timestamps)).toBeGreaterThan(95)
  })

  it('is low when rhythm is erratic', () => {
    const timestamps: number[] = []
    for (let i = 0; i < 50; i++) timestamps.push(i * 20) // burst in bucket 0
    for (let i = 0; i < 5; i++) timestamps.push(1000 + i * 80) // trickle in bucket 1
    for (let i = 0; i < 50; i++) timestamps.push(2000 + i * 20) // burst in bucket 2
    for (let i = 0; i < 5; i++) timestamps.push(3000 + i * 80) // trickle in bucket 3
    // halves the time at very different speeds -> low consistency
    expect(computeConsistency(4, timestamps)).toBeLessThan(80)
  })

  it('clamps into [0, 100]', () => {
    const out = computeConsistency(10, Array.from({ length: 20 }, (_, i) => i * 100))
    expect(out).toBeGreaterThanOrEqual(0)
    expect(out).toBeLessThanOrEqual(100)
  })
})