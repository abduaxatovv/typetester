import { WORD_LISTS } from '@/data/words'
import { allQuotes } from '@/data/quotes'
import type { Language } from '@/types'

/** Collapses whitespace runs / newlines into single spaces. */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Picks a word that differs from the previous one to avoid ugly repeats. */
function pickWord(list: string[], previous: string | null, rand: () => number): string {
  if (list.length <= 1) return list[0] ?? ''
  let word = list[Math.floor(rand() * list.length)]
  let guard = 0
  while (word === previous && guard < 8) {
    word = list[Math.floor(rand() * list.length)]
    guard++
  }
  return word
}

export interface GeneratedText {
  text: string
  /** For count-based modes: exact number of characters to type. */
  charLimit: number
}

export function generateWords(
  language: Language,
  count: number,
  rand: () => number = Math.random,
): GeneratedText {
  const list = WORD_LISTS[language]
  const words: string[] = []
  let previous: string | null = null
  for (let i = 0; i < count; i++) {
    if (i > 0 && i % list.length === 0) {
      // Cycle the list to keep the exact word count for very large targets.
    }
    const word = pickWord(list, previous, rand)
    words.push(word)
    previous = word
  }
  const text = normalizeText(words.join(' '))
  return { text, charLimit: text.length }
}

export function generateQuote(
  language: Language,
  quoteId?: string,
  rand: () => number = Math.random,
): GeneratedText {
  const quotes = allQuotes(language)
  const quote =
    quotes.find((q) => q.id === quoteId) ??
    quotes[Math.floor(rand() * quotes.length)] ??
    quotes[0]
  const text = normalizeText(quote.text)
  return { text, charLimit: text.length }
}

export function fromCustomText(content: string): GeneratedText {
  const text = normalizeText(content)
  return { text, charLimit: text.length }
}