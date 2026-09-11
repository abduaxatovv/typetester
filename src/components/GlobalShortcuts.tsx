import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * App-wide keyboard shortcuts (desktop webviews):
 *   Ctrl/Cmd + ,  → Settings
 *   Ctrl/Cmd + H  → History
 * These do not clash with the test screen's own shortcuts (Ctrl+R restart,
 * Esc pause), which are handled locally on the test page.
 */
export function GlobalShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.shiftKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (key === ',') {
        e.preventDefault()
        navigate('/settings')
      } else if (key === 'h') {
        e.preventDefault()
        navigate('/history')
      } else if (key === 'r') {
        // The test screen handles restart when it is the active page.
      }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [navigate])

  return null
}