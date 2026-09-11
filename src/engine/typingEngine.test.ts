import { describe, expect, it, beforeEach } from 'vitest'
import { TypingEngine } from '@/engine/typingEngine'

/** Controllable clock so timer behavior is deterministic. */
class FakeClock {
  now = 0
  tick(ms: number) {
    this.now += ms
  }
  read = () => this.now
}

const TEXT = 'the quick brown fox jumps over the lazy dog'
const WORDS_LIMIT = 10

function makeWordsEngine(clock: FakeClock, count = WORDS_LIMIT) {
  const words = TEXT.split(' ').slice(0, count)
  const text = words.join(' ')
  return new TypingEngine(
    {
      expected: text,
      charLimit: text.length,
      timeLimitMs: null,
      mode: 'words',
      target: count,
    },
    clock.read,
  )
}

function makeTimeEngine(clock: FakeClock, seconds = 15) {
  return new TypingEngine(
    {
      expected: TEXT,
      charLimit: null,
      timeLimitMs: seconds * 1000,
      mode: 'time',
      target: seconds,
    },
    clock.read,
  )
}

describe('TypingEngine — core input handling', () => {
  let clock: FakeClock

  beforeEach(() => {
    clock = new FakeClock()
  })

  it('starts idle and does not run the clock until the first keypress', () => {
    const engine = makeWordsEngine(clock)
    expect(engine.status).toBe('idle')
    clock.tick(10_000)
    const snapshot = engine.getSnapshot()
    expect(snapshot.elapsedSeconds).toBe(0)
    expect(snapshot.wpm).toBe(0)
  })

  it('registers correct characters and computes accuracy of 100', () => {
    const engine = makeWordsEngine(clock)
    const first3 = TEXT.slice(0, 3)
    for (const ch of first3) engine.type(ch)
    clock.tick(60_000)
    const s = engine.getSnapshot()
    expect(s.correctCount).toBe(3)
    expect(s.errors).toBe(0)
    expect(s.incorrectCount).toBe(0)
    expect(s.accuracy).toBe(100)
    // 3 chars / 5 / 1 min = 0.6 WPM
    expect(s.wpm).toBeCloseTo(0.6, 4)
  })

  it('marks incorrect characters, does not auto-skip, and requires backspace', () => {
    const engine = makeWordsEngine(clock)
    engine.type('x') // wrong first char
    const s1 = engine.getSnapshot()
    expect(s1.correctCount).toBe(0)
    expect(s1.incorrectCount).toBe(1)
    expect(s1.errors).toBe(1)
    expect(s1.caretIndex).toBe(1) // caret advanced past the error
    expect(s1.accuracy).toBe(0)

    engine.type('h') // 'x','h' — h is correct for expected[1]
    const s2 = engine.getSnapshot()
    expect(s2.caretIndex).toBe(2)
    expect(s2.correctCount).toBe(1)
    expect(s2.errors).toBe(1)
    expect(s2.accuracy).toBeCloseTo(50, 4)
  })

  it('backspaces the last character and allows correction', () => {
    const engine = makeWordsEngine(clock)
    engine.type('x')
    engine.backspace()
    const s = engine.getSnapshot()
    expect(s.caretIndex).toBe(0)
    expect(s.typed).toBe('')
    expect(s.errors).toBe(1) // committed error stays counted
    expect(s.accuracy).toBe(0) // 0 correct vs 1 committed error

    engine.type('t')
    engine.type('h')
    const s2 = engine.getSnapshot()
    expect(s2.correctCount).toBe(2)
    expect(s2.errors).toBe(1)
    expect(s2.accuracy).toBeCloseTo(66.67, 1)
  })

  it('does nothing on backspace when nothing is typed', () => {
    const engine = makeWordsEngine(clock)
    engine.backspace()
    expect(engine.getSnapshot().caretIndex).toBe(0)
  })

  it('finishes when the exact character limit is reached', () => {
    const engine = makeWordsEngine(clock, 2) // "the quick"
    const expected = 'the quick'
    for (const ch of expected) engine.type(ch)
    expect(engine.status).toBe('finished')
    const s = engine.getSnapshot()
    expect(s.completed).toBe(true)
    expect(s.caretIndex).toBe(expected.length)
  })

  it('ignores input after finishing', () => {
    const engine = makeWordsEngine(clock, 1) // "the"
    for (const ch of 'the') engine.type(ch)
    expect(engine.status).toBe('finished')
    expect(engine.type('x')).toBe(false)
    expect(engine.getSnapshot().typed).toBe('the')
  })

  it('handles long texts without issues', () => {
    const longText = Array.from({ length: 500 }, (_, i) =>
      TEXT[i % TEXT.length],
    ).join('')
    const engine = new TypingEngine(
      { expected: longText, charLimit: null, timeLimitMs: 600_000, mode: 'time', target: 600 },
      clock.read,
    )
    let ok = 0
    for (const ch of longText) {
      if (engine.type(ch)) ok++
    }
    expect(ok).toBe(longText.length)
    expect(engine.status).toBe('running') // time mode does not auto-finish at text end
  })

  it('treats every letter literally (spaces are compared too)', () => {
    const engine = makeWordsEngine(clock, 3) // "the quick"
    for (const ch of 'the quickx') engine.type(ch) // 'x' should be wrong at last pos
    expect(engine.getSnapshot().errors).toBe(1)
  })
})

describe('TypingEngine — timer behavior', () => {
  let clock: FakeClock

  beforeEach(() => {
    clock = new FakeClock()
  })

  it('accumulates elapsed time based on the injected clock', () => {
    const engine = makeWordsEngine(clock)
    engine.type('t')
    clock.tick(2500)
    expect(engine.getElapsedSeconds()).toBeCloseTo(2.5, 4)
  })

  it('freezes elapsed time while paused and continues on resume', () => {
    const engine = makeWordsEngine(clock)
    engine.type('t')
    clock.tick(1000)
    engine.pause()
    clock.tick(9000) // paused — should not count
    expect(engine.getElapsedSeconds()).toBeCloseTo(1, 4)
    engine.resume()
    clock.tick(2000)
    expect(engine.getElapsedSeconds()).toBeCloseTo(3, 4)
  })

  it('time mode finishes exactly when the limit elapses (checked by ticker)', () => {
    const engine = makeTimeEngine(clock, 15)
    engine.type('a')
    clock.tick(14_500)
    engine.checkTimeLimit()
    expect(engine.status).toBe('running')
    clock.tick(600) // crosses 15s
    engine.checkTimeLimit()
    expect(engine.status).toBe('finished')
    expect(engine.getSnapshot().completed).toBe(true)
  })

  it('elapsed time is never negative even with clock edge cases', () => {
    const engine = makeTimeEngine(clock, 15)
    engine.type('a')
    clock.now = -50
    expect(engine.getElapsedSeconds()).toBeGreaterThanOrEqual(0)
  })

  it('finish() freezes metrics at the given snapshot', () => {
    const engine = makeWordsEngine(clock)
    engine.type('t')
    clock.tick(3000)
    engine.finish()
    const before = engine.getSnapshot()
    clock.tick(60_000)
    expect(engine.getSnapshot().elapsedSeconds).toBeCloseTo(before.elapsedSeconds, 4)
    expect(engine.status).toBe('finished')
  })
})

describe('TypingEngine — restart', () => {
  let clock: FakeClock

  beforeEach(() => {
    clock = new FakeClock()
  })

  it('fully resets all counters and status', () => {
    const engine = makeTimeEngine(clock, 15)
    engine.type('the quick brown fox')
    clock.tick(10_000)
    engine.pause()
    engine.finish()
    engine.reset()
    const s = engine.getSnapshot()
    expect(s.status).toBe('idle')
    expect(s.typed).toBe('')
    expect(s.caretIndex).toBe(0)
    expect(s.wpm).toBe(0)
    expect(s.accuracy).toBe(100)
    expect(s.errors).toBe(0)
    expect(s.elapsedSeconds).toBe(0)
    expect(s.keypresses).toBe(0)
    expect(s.completed).toBe(false)
    expect(engine.getElapsedSeconds()).toBe(0)
  })

  it('can run again cleanly after reset with correct stats', () => {
    const engine = makeWordsEngine(clock, 3)
    for (const ch of 'the quick brown') engine.type(ch)
    engine.reset()
    clock.tick(0)
    for (const ch of 'the') engine.type(ch)
    engine.finish()
    const result = engine.finalData
    expect(result.correctChars).toBe(3)
    expect(result.errors).toBe(0)
    expect(result.totalChars).toBe(3)
  })
})

describe('TypingEngine — results integrity', () => {
  let clock: FakeClock

  beforeEach(() => {
    clock = new FakeClock()
  })

  it('never produces NaN or Infinity in a final result', () => {
    const engine = makeTimeEngine(clock, 15)
    engine.type('t')
    clock.tick(10_000)
    engine.finish()
    const { wpm, rawWpm, accuracy, consistency } = engine.finalData
    for (const v of [wpm, rawWpm, accuracy, consistency]) {
      expect(Number.isFinite(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
    }
  })

  it('records correct vs incorrect vs errors consistently', () => {
    const engine = makeWordsEngine(clock, 10)
    const text = engine.getSnapshot().expected
    let i = 0
    for (const ch of text) {
      engine.type(ch)
      clock.tick(40) // a realistic inter-keystroke interval
      i++
    }
    expect(engine.status).toBe('finished')
    const f = engine.finalData
    expect(f.correctChars).toBe(text.length)
    expect(f.incorrectChars).toBe(0)
    expect(f.errors).toBe(0)
    expect(f.totalChars).toBe(text.length)
    expect(f.wpm).toBeGreaterThan(0)
    expect(f.accuracy).toBe(100)
  })

  it('a very short test remains valid', () => {
    const engine = makeTimeEngine(clock, 15)
    engine.type('t')
    clock.tick(500)
    engine.finish()
    const f = engine.finalData
    expect(Number.isFinite(f.wpm)).toBe(true)
    expect(f.totalChars).toBe(1)
    expect(f.consistency).toBeGreaterThanOrEqual(0)
  })

  it('empty test (no typing) yields a valid zero-result', () => {
    const engine = makeTimeEngine(clock, 15)
    engine.finish()
    const f = engine.finalData
    expect(f.wpm).toBe(0)
    expect(f.totalChars).toBe(0)
    expect(f.accuracy).toBe(100)
  })
})

describe('TypingEngine — custom duration modes', () => {
  it('accepts arbitrary (custom) durations', () => {
    const clock = new FakeClock()
    const engine = makeTimeEngine(clock, 77)
    expect(engine.timeLimit).toBe(77_000)
    engine.type('a')
    clock.tick(77_000)
    engine.checkTimeLimit()
    expect(engine.status).toBe('finished')
  })
})