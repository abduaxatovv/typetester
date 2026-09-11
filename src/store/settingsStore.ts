import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import localforage from 'localforage'
import type { Settings } from '@/types'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accentHue: 205,
  fontSize: 22,
  textOpacity: 0.62,
  cursorStyle: 'line',
  caretAnimated: true,
  smoothScroll: false,
  soundEnabled: true,
  keypressSound: true,
  errorSound: true,
  showLiveWpm: true,
  showLiveAccuracy: true,
  showErrors: true,
  showTimer: true,
  defaultMode: 'words',
  defaultDuration: 30,
  defaultWordCount: 25,
  defaultLanguage: 'en',
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  integerConfidence: false,
  quickRestartKeys: ['tab'],
}

interface SettingsStore {
  settings: Settings
  set: (patch: Partial<Settings>) => void
  reset: () => void
}

/**
 * Persisted per-device settings. Backed by IndexedDB (localforage) so it
 * survives restarts, fully offline.
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      set: (patch) => set({ settings: { ...get().settings, ...patch } }),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => localforage),
      partialize: (state) => ({ settings: state.settings }),
      // Deep-merge persisted settings over the current defaults so settings
      // saved by older builds (missing newer keys) migrate without losing
      // user preferences or crashing.
      merge: (persisted, current) => {
        const p = persisted as { settings?: Partial<Settings> } | undefined
        return {
          ...current,
          settings: { ...DEFAULT_SETTINGS, ...(p?.settings ?? {}) },
        }
      },
    },
  ),
)

export const selectSettings = (s: SettingsStore) => s.settings