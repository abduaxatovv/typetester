import { useCallback, useEffect, useRef, useState } from 'react'
import { TypingEngine } from '@/engine/typingEngine'
import { fromCustomText, generateQuote, generateWords } from '@/engine/textGenerator'
import { useSettingsStore } from '@/store/settingsStore'
import { useDataStore } from '@/store/dataStore'
import { ACHIEVEMENTS, evaluate } from '@/store/achievements'
import { uid } from '@/lib/utils'
import { playCompleteSound, playErrorSound, playKeypressSound } from '@/lib/sound'
import type { Language, TestMode, TestResult } from '@/types'

export interface EngineConfigState {
  mode: TestMode
  language: Language
  duration: number
  wordCount: number
  quoteId: string | null
  customTextId: string | null
}

export interface TextState {
  expected: string
  typed: string
  caretIndex: number
}

export interface LiveState {
  wpm: number
  rawWpm: number
  accuracy: number
  errors: number
  incorrect: number
  correct: number
  keypresses: number
  elapsedSeconds: number
  remainingMs: number | null
  progress: number
}

export type EngineStatus = 'idle' | 'running' | 'paused' | 'finished'

const emptyLive: LiveState = {
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  errors: 0,
  incorrect: 0,
  correct: 0,
  keypresses: 0,
  elapsedSeconds: 0,
  remainingMs: 0,
  progress: 0,
}

function buildEngine(config: EngineConfigState, customContent?: string) {
  let expected = ''
  let charLimit: number | null = null
  let timeLimitMs: number | null = null
  let target: number | null = null

  switch (config.mode) {
    case 'time':
      timeLimitMs = config.duration * 1000
      target = config.duration
      expected = generateWords(
        config.language,
        Math.max(30, Math.ceil(config.duration * 2)),
      ).text
      break
    case 'words':
      target = config.wordCount
      ;({ text: expected, charLimit } = generateWords(config.language, config.wordCount))
      break
    case 'quote':
      ;({ text: expected, charLimit } = generateQuote(config.language, config.quoteId ?? undefined))
      break
    case 'custom':
      ;({ text: expected, charLimit } = fromCustomText(customContent ?? ''))
      break
    case 'zen':
      target = config.wordCount
      ;({ text: expected, charLimit } = generateWords(config.language, config.wordCount))
      break
  }

  return new TypingEngine({ expected, charLimit, timeLimitMs, mode: config.mode, target })
}

export function useTestEngine() {
  const settings = useSettingsStore((s) => s.settings)
  const customTexts = useDataStore((s) => s.customTexts)
  const addResult = useDataStore((s) => s.addResult)

  const findContent = useCallback(
    (cfg: EngineConfigState) =>
      cfg.customTextId
        ? customTexts.find((t) => t.id === cfg.customTextId)?.content
        : undefined,
    [customTexts],
  )

  const [config, setConfig] = useState<EngineConfigState>(() => ({
    mode: settings.defaultMode,
    language: settings.defaultLanguage,
    duration: settings.defaultDuration,
    wordCount: settings.defaultWordCount,
    quoteId: null,
    customTextId: null,
  }))

  const engineRef = useRef<TypingEngine | null>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement | null>(null)
  const finishedRef = useRef(false)

  const [status, setStatus] = useState<EngineStatus>('idle')
  const [text, setText] = useState<TextState>({ expected: '', typed: '', caretIndex: 0 })
  const [live, setLive] = useState<LiveState>(emptyLive)
  const [result, setResult] = useState<TestResult | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([])

  const publishLive = useCallback((engine: TypingEngine) => {
    const s = engine.getSnapshot()
    setLive({
      wpm: Math.max(0, s.wpm),
      rawWpm: Math.max(0, s.rawWpm),
      accuracy: Math.max(0, s.accuracy),
      errors: s.errors,
      incorrect: s.incorrectCount,
      correct: s.correctCount,
      keypresses: s.keypresses,
      elapsedSeconds: s.elapsedSeconds,
      remainingMs: s.remainingMs,
      progress:
        engine.timeLimit !== null
          ? 1 - (s.remainingMs ?? 0) / engine.timeLimit
          : engine.charLimit !== null && engine.charLimit > 0
            ? s.typed.length / engine.charLimit
            : 0,
    })
  }, [])

  const publishText = useCallback((engine: TypingEngine) => {
    const s = engine.getSnapshot()
    setText({ expected: s.expected, typed: s.typed, caretIndex: s.caretIndex })
  }, [])

  const publishBoth = useCallback(
    (engine: TypingEngine) => {
      publishLive(engine)
      publishText(engine)
    },
    [publishLive, publishText],
  )

  const createFresh = useCallback(
    (cfg: EngineConfigState, focused = true) => {
      const engine = buildEngine(cfg, findContent(cfg))
      engineRef.current = engine
      finishedRef.current = false
      setStatus('idle')
      setResult(null)
      setNewlyUnlocked([])
      publishBoth(engine)
      if (focused) hiddenInputRef.current?.focus()
      return engine
    },
    [findContent, publishBoth],
  )

  // Mount: create the initial engine.
  useEffect(() => {
    createFresh(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = useCallback(
    (engine: TypingEngine) => {
      if (finishedRef.current) return
      finishedRef.current = true
      engine.finish()
      const finalData = engine.finalData

      const testResult: TestResult = {
        id: uid(),
        mode: engine.modeName,
        language: config.language,
        target: engine.targetValue,
        wpm: Math.round(finalData.wpm),
        rawWpm: Math.round(finalData.rawWpm * 10) / 10,
        accuracy: Math.round(finalData.accuracy * 10) / 10,
        correctChars: finalData.correctChars,
        incorrectChars: finalData.incorrectChars,
        errors: finalData.errors,
        totalChars: finalData.totalChars,
        keypresses: finalData.keypresses,
        elapsedSeconds: Number(finalData.elapsedSeconds.toFixed(2)),
        consistency: Math.round(finalData.consistency * 10) / 10,
        createdAt: new Date().toISOString(),
      }

      const before = useDataStore.getState().achievements
      addResult(testResult)
      const { newlyUnlocked: ids } = evaluate(
        useDataStore.getState().results,
        useDataStore.getState().customTexts.length,
        before,
      )
      if (ids.length > 0) {
        setNewlyUnlocked(
          ids
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name)
            .filter((n): n is string => Boolean(n)),
        )
      }
      playCompleteSound()
      hiddenInputRef.current?.blur()
      setStatus('finished')
      publishText(engine)
      publishLive(engine)
      setResult(testResult)
    },
    [addResult, config.language, publishLive, publishText],
  )

  const handleChar = useCallback(
    (char: string) => {
      const engine = engineRef.current
      if (!engine || engine.status === 'finished' || engine.status === 'paused') return
      if (!engine.type(char)) return
      publishLive(engine)
      publishText(engine)
      if (settings.soundEnabled) {
        const s = engine.getSnapshot()
        const isError = char !== s.expected[s.caretIndex - 1]
        if (isError && settings.errorSound) playErrorSound()
        else if (!isError && settings.keypressSound) playKeypressSound()
      }
      const current = engine.status as EngineStatus
      if (current === 'finished') {
        finish(engine)
      }
    },
    [finish, publishLive, publishText, settings.soundEnabled, settings.keypressSound, settings.errorSound],
  )

  const handleBackspace = useCallback(() => {
    const engine = engineRef.current
    if (!engine || engine.status !== 'running') return
    engine.backspace()
    publishLive(engine)
    publishText(engine)
  }, [publishLive, publishText])

  const togglePause = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (engine.status === 'running' && status !== 'paused') {
      engine.pause()
      setStatus('paused')
      publishLive(engine)
      publishText(engine)
    } else if (engine.status === 'paused') {
      engine.resume()
      setStatus('running')
      hiddenInputRef.current?.focus()
    }
  }, [publishLive, publishText, status])

  const reset = useCallback(
    (patch?: Partial<EngineConfigState>) => {
      const next = { ...config, ...patch }
      setConfig(next)
      if (hiddenInputRef.current) hiddenInputRef.current.value = ''
      createFresh(next)
    },
    [config, createFresh],
  )

  const changeConfig = useCallback(
    (patch: Partial<EngineConfigState>) => {
      const next = { ...config, ...patch }
      setConfig(next)
      if (hiddenInputRef.current) hiddenInputRef.current.value = ''
      createFresh(next)
    },
    [config, createFresh],
  )

  const finishNow = useCallback(() => {
    const engine = engineRef.current
    if (engine) finish(engine)
  }, [finish])

  // Live ticker drives the clock + time-limit completion check.
  useEffect(() => {
    const id = setInterval(() => {
      const engine = engineRef.current
      if (!engine) return
      const st = engine.status as EngineStatus
      if (st === 'running') {
        engine.checkTimeLimit()
        publishLive(engine)
        const after = engine.status as EngineStatus
        if (after === 'finished') finish(engine)
      } else if (st === 'idle') {
        publishLive(engine)
      }
    }, 120)
    return () => clearInterval(id)
  }, [finish, publishLive])

  return {
    config,
    status,
    text,
    live,
    result,
    newlyUnlocked,
    customTexts,
    reset,
    changeConfig,
    handleChar,
    handleBackspace,
    togglePause,
    finishNow,
    hiddenInputRef,
  }
}