import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { unlockAudio } from '@/lib/sound'
import { isStorageAvailable } from '@/lib/storage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// One-tap audio unlock only — never a network request.
window.addEventListener(
  'pointerdown',
  () => unlockAudio(),
  { once: false, passive: true },
)

if (!isStorageAvailable()) {
  // Extremely unusual (disabled IndexedDB); the app still works in-memory.
  // eslint-disable-next-line no-console
  console.warn(
    'TypeTester: IndexedDB is unavailable — data will not persist across restarts.',
  )
}