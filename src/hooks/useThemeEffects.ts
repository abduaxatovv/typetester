import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

/**
 * Applies persisted settings to the document root:
 * theme, accent hue, font size, text opacity, reduced motion and
 * high-contrast accessibility modes. Runs in all platforms.
 */
export function useThemeEffects(): void {
  const theme = useSettingsStore((s) => s.settings.theme)
  const accentHue = useSettingsStore((s) => s.settings.accentHue)
  const fontSize = useSettingsStore((s) => s.settings.fontSize)
  const reducedMotion = useSettingsStore((s) => s.settings.reducedMotion)
  const highContrast = useSettingsStore((s) => s.settings.highContrast)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : theme
    root.classList.add(resolved)
    root.style.colorScheme = resolved
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-h', String(accentHue))
  }, [accentHue])

  useEffect(() => {
    const variable = document.querySelector<HTMLElement>('#test-text')?.style
    if (variable) variable.setProperty('--test-font-size', `${fontSize}px`)
    document.documentElement.style.setProperty('--test-font-size', `${fontSize}px`)
  }, [fontSize])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast)
  }, [highContrast])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const resolved = theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
        : theme
      meta.setAttribute('content', resolved === 'light' ? '#f5f6f8' : '#16181d')
    }
  }, [theme])
}