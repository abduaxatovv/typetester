import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import localforage from 'localforage'
import type { AchievementState, CustomText, DataExport, TestResult } from '@/types'
import { evaluate } from '@/store/achievements'
import { useSettingsStore } from '@/store/settingsStore'

interface DataStore {
  results: TestResult[]
  customTexts: CustomText[]
  achievements: AchievementState
  addResult: (result: TestResult) => void
  deleteResult: (id: string) => void
  clearResults: () => void
  addCustomText: (text: CustomText) => void
  updateCustomText: (text: CustomText) => void
  deleteCustomText: (id: string) => void
  /** Applies a validated import bundle (merge). Caller confirms first. */
  applyImport: (bundle: DataExport) => void
  buildExport: () => DataExport
}

/** Recompute achievements whenever results/custom texts change. */
function withAchievements(
  results: TestResult[],
  customTexts: CustomText[],
  current: AchievementState,
): AchievementState {
  return evaluate(results, customTexts.length, current).state
}

/**
 * All user data (test results, custom texts, achievements).
 * Persisted to the device via IndexedDB — no server, no cloud.
 */
export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      results: [],
      customTexts: [],
      achievements: {},

      addResult: (result) => {
        const results = [result, ...get().results]
        set({
          results,
          achievements: withAchievements(results, get().customTexts, get().achievements),
        })
      },

      deleteResult: (id) => {
        const results = get().results.filter((r) => r.id !== id)
        set({
          results,
          achievements: withAchievements(results, get().customTexts, get().achievements),
        })
      },

      clearResults: () => {
        set({
          results: [],
          achievements: withAchievements([], get().customTexts, get().achievements),
        })
      },

      addCustomText: (text) => {
        const customTexts = [text, ...get().customTexts]
        set({
          customTexts,
          achievements: withAchievements(get().results, customTexts, get().achievements),
        })
      },

      updateCustomText: (text) => {
        const customTexts = get().customTexts.map((t) => (t.id === text.id ? text : t))
        set({
          customTexts,
          achievements: withAchievements(get().results, customTexts, get().achievements),
        })
      },

      deleteCustomText: (id) => {
        const customTexts = get().customTexts.filter((t) => t.id !== id)
        set({
          customTexts,
          achievements: withAchievements(get().results, customTexts, get().achievements),
        })
      },

      applyImport: (bundle) => {
        const merged = [...bundle.results, ...get().results].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        )
        set({
          results: merged,
          customTexts: bundle.customTexts,
          achievements: withAchievements(merged, bundle.customTexts, get().achievements),
        })
      },

      buildExport: () => ({
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: useSettingsStore.getState().settings,
        results: get().results,
        customTexts: get().customTexts,
        achievements: get().achievements,
      }),
    }),
    {
      name: 'data',
      storage: createJSONStorage(() => localforage),
      partialize: (state) => ({
        results: state.results,
        customTexts: state.customTexts,
        achievements: state.achievements,
      }),
    },
  ),
)

export { evaluate }