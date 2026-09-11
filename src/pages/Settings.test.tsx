import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Settings from '@/pages/Settings'
import { useSettingsStore, DEFAULT_SETTINGS } from '@/store/settingsStore'

describe('Settings keyboard reset', () => {
  beforeEach(() => {
    // Start from pristine defaults (localforage falls back to jsdom localStorage).
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })
  })

  it('resets the focused theme control back to its default on Escape', () => {
    useSettingsStore.getState().set({ theme: 'light' })

    render(<Settings />)
    screen.getByRole('button', { name: 'Dark' }).focus()
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(useSettingsStore.getState().settings.theme).toBe(DEFAULT_SETTINGS.theme)
  })

  it('resets a focused switch back to its default on Escape', () => {
    useSettingsStore.getState().set({ soundEnabled: false })

    render(<Settings />)
    screen.getByLabelText('Sound effects').focus()
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(useSettingsStore.getState().settings.soundEnabled).toBe(true)
  })

  it('does not change settings when nothing specific is focused', () => {
    useSettingsStore.getState().set({ fontSize: 13 })

    render(<Settings />)
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(useSettingsStore.getState().settings.fontSize).toBe(13)
  })
})