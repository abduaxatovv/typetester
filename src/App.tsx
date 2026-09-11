import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import TestScreen from '@/pages/TestScreen'
import History from '@/pages/History'
import Achievements from '@/pages/Achievements'
import CustomTexts from '@/pages/CustomTexts'
import Settings from '@/pages/Settings'
import { GlobalShortcuts } from '@/components/GlobalShortcuts'

const Statistics = lazy(() => import('@/pages/Statistics'))

/**
 * HashRouter keeps deep links working when the bundle is served from the
 * local file system or a custom protocol (Tauri / Capacitor / offline web),
 * where path routing would otherwise break on reload.
 */
function App() {
  return (
    <HashRouter>
      <GlobalShortcuts />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="/test" element={<TestScreen />} />
          <Route path="/history" element={<History />} />
          <Route
            path="/stats"
            element={
              <Suspense fallback={<div className="p-8 text-muted-foreground">Loading statistics…</div>}>
                <Statistics />
              </Suspense>
            }
          />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/custom-texts" element={<CustomTexts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  )
}

export default App