import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  ChevronDown,
  Home,
  Keyboard,
  MoreHorizontal,
  Settings as SettingsIcon,
  Trophy,
  FileText,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useThemeEffects } from '@/hooks/useThemeEffects'
import { Logo } from '@/components/Logo'

const NAV = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/test', label: 'Typing Test', icon: Keyboard },
  { to: '/history', label: 'History', icon: History },
  { to: '/stats', label: 'Statistics', icon: BarChart3 },
  { to: '/achievements', label: 'Achievements', icon: Trophy },
  { to: '/custom-texts', label: 'Custom Texts', icon: FileText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

/**
 * App shell: persistent sidebar (desktop) + bottom tab bar (mobile).
 * Applies theme effects and global navigation keyboard shortcuts.
 */
export function AppShell() {
  useThemeEffects()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-bg text-text">
      <Sidebar onShortcut={navigate} />
      <MobileTopBar onShortcut={navigate} />
      <main className="md:pl-64 px-4 pb-24 md:pb-8 pt-20 md:pt-6">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}

function Sidebar({ onShortcut }: { onShortcut: (path: string) => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-bg-elevated md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="-ml-2 flex items-center gap-2.5">
          <Logo className="translate-y-0" />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">TypeTester</div>
            <div className="text-[11px] text-muted">Practice. Type. Improve.</div>
          </div>
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-surface hover:text-text',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-3 text-xs text-muted"
          onClick={() => onShortcut('/settings')}
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  )
}

function MobileTopBar({ onShortcut }: { onShortcut: (path: string) => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur md:hidden">
      <button
        className="flex items-center gap-2 text-left cursor-pointer"
        onClick={() => onShortcut('/')}
        aria-label="Home"
      >
        <Logo className="h-7 w-7" />
        <span className="text-base font-semibold tracking-tight">TypeTester</span>
      </button>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="iconSm"
          aria-label="Settings"
          onClick={() => onShortcut('/settings')}
        >
          <SettingsIcon className="h-4.5 w-4.5" />
        </Button>
      </div>
    </header>
  )
}

function MobileBottomNav() {
  const [expanded, setExpanded] = useState(false)
  const primary = NAV.slice(0, 5)
  const overflow = NAV.slice(5)
  const navigate = useNavigate()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-bg-elevated/95 px-2 py-1.5 backdrop-blur md:hidden"
      aria-label="Mobile primary"
    >
      {primary.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex min-w-14 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium',
              isActive ? 'text-accent' : 'text-muted',
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
      <div className="relative">
        {expanded && (
          <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-1 rounded-xl border border-border bg-bg-elevated p-2 shadow-xl">
            {overflow.map((item) => (
              <button
                key={item.to}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface hover:text-text cursor-pointer"
                onClick={() => {
                  navigate(item.to)
                  setExpanded(false)
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        )}
        <button
          className="flex min-w-14 cursor-pointer flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium text-muted"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label="More"
        >
          {expanded ? <ChevronDown /> : <MoreHorizontal />}
          More
        </button>
      </div>
    </nav>
  )
}