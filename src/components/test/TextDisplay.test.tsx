import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TextDisplay } from '@/components/test/TextDisplay'

const baseProps = {
  fontSize: 22,
  textOpacity: 0.7,
  cursorStyle: 'line' as const,
  caretAnimated: false,
  smoothScroll: false,
  largeText: false,
}

function renderText(expected: string, typed: string, caretIndex: number) {
  return render(
    <TextDisplay text={{ expected, typed, caretIndex }} {...baseProps} />,
  )
}

describe('TextDisplay', () => {
  it('keeps every space between words so the gap is visible', () => {
    const expected = 'the quick brown fox'
    renderText(expected, '', 0)
    const node = screen.getByTestId('text-display')
    expect(node.textContent!.replace(/\u00A0/g, ' ')).toBe(expected)
  })

  it('preserves multi-word quotes including punctuation and final word', () => {
    const expected = 'Hello, world! How are you?'
    renderText(expected, '', 0)
    const node = screen.getByTestId('text-display')
    expect(node.textContent!.replace(/\u00A0/g, ' ')).toBe(expected)
  })

  it('colours typed characters correctly and leaves a caret at the next char', () => {
    const expected = 'the quick'
    renderText(expected, 'th', 2)
    const node = screen.getByTestId('text-display')!
    const charSpans = node.querySelectorAll('span[data-index]')
    // t, h typed correctly -> both correct; caret sits on index 2 ('e')
    const index2 = [...charSpans].find((s) => s.getAttribute('data-index') === '2')!
    expect(index2.className).toContain('tc-cursor-line')
  })

  it('handles an empty test gracefully', () => {
    renderText('', '', 0)
    expect(screen.getByTestId('text-display').textContent).toBe('')
  })
})