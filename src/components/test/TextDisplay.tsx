import { memo, useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { CursorStyle } from '@/types'
import type { TextState } from '@/components/test/useTestEngine'

interface TextDisplayProps {
  text: TextState
  fontSize: number
  textOpacity: number
  cursorStyle: CursorStyle
  caretAnimated: boolean
  smoothScroll: boolean
  largeText: boolean
}

interface WordModel {
  chars: string[]
  start: number
}

/**
 * Renders the expected text one character at a time so each character can
 * be colored (correct / incorrect / remaining) and annotated with the caret.
 * Words are `inline-block` so lines break only at spaces, like a premium
 * typing test. Long texts are scrolled through a fixed-height viewport.
 */
export const TextDisplay = memo(function TextDisplay({
  text,
  fontSize,
  textOpacity,
  cursorStyle,
  caretAnimated,
  smoothScroll,
  largeText,
}: TextDisplayProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)

  const expected = text.expected
  const typedLen = text.typed.length

  const words = useMemo<WordModel[]>(() => {
    const out: WordModel[] = []
    let run: string[] = []
    let start = -1
    for (let i = 0; i < expected.length; i++) {
      const ch = expected[i]
      const isWs = ch === ' ' || ch === '\t' || ch === '\n'
      if (start === -1) start = i
      // The separating space is kept as the word's last character so the
      // words render with a real gap and the space index has its own caret
      // and correct/incorrect state.
      run.push(ch)
      if (isWs) {
        out.push({ chars: run, start })
        run = []
        start = -1
      }
    }
    if (run.length) out.push({ chars: run, start: start === -1 ? expected.length : start })
    return out
  }, [expected])

  // Keep the caret visible inside the scrolling viewport.
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp || typeof vp.scrollTo !== 'function') return
    const caret = caretRef.current
    const target = caret ?? vp
    const rect = target.getBoundingClientRect()
    const vpRect = vp.getBoundingClientRect()
    if (rect.top < vpRect.top || rect.bottom > vpRect.bottom) {
      (caret ?? (vp as HTMLDivElement)).scrollIntoView({
        block: 'nearest',
        behavior: smoothScroll ? 'smooth' : 'auto',
      })
    }
  }, [text.caretIndex, smoothScroll])

  const effectiveSize = (largeText ? Math.round(fontSize * 1.25) : fontSize) + 'px'

  return (
    <div
      ref={viewportRef}
      id="test-text"
      className="typing-test-viewport relative overflow-y-auto pr-1 rounded-md focus:outline-none"
      style={{
        height: largeText ? '300px' : '220px',
        fontSize: effectiveSize,
        fontFamily: 'var(--font-mono)',
        lineHeight: 1.25,
      }}
      data-testid="text-display"
    >
      <div className="min-h-full pb-1">
        <span aria-hidden="true">
          {words.map((word) => (
            <span key={word.start} className="inline-block">
              {word.chars.map((ch, offset) => {
                const index = word.start + offset
                let className = 'tc-untyped'
                if (index < typedLen) {
                  className =
                    text.typed[index] === ch ? 'tc-correct' : 'tc-incorrect'
                }
                const isCurrentCaret = index === text.caretIndex
                if (isCurrentCaret) {
                  className = cn(
                    className,
                    caretClass(cursorStyle),
                    caretAnimated && 'cursor-anim',
                  )
                }
                return (
                  <span
                    key={index}
                    className={className}
                    style={
                      index >= typedLen
                        ? { opacity: textOpacity }
                        : undefined
                    }
                    ref={isCurrentCaret ? caretRef : undefined}
                    data-index={index}
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                )
              })}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
})

function caretClass(style: CursorStyle): string {
  switch (style) {
    case 'block':
      return 'tc-cursor-block'
    case 'underline':
      return 'tc-cursor-underline'
    case 'line':
    default:
      return 'tc-cursor-line'
  }
}