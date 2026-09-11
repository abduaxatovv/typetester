import { cn } from '@/lib/utils'

/** Inline brand mark — no external assets. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-6 w-6', className)}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--accent)" />
      <rect x="7" y="10" width="5" height="3.5" rx="1" fill="rgba(255,255,255,0.95)" />
      <rect x="13.5" y="10" width="5" height="3.5" rx="1" fill="rgba(255,255,255,0.62)" />
      <rect x="20" y="10" width="5" height="3.5" rx="1" fill="rgba(255,255,255,0.62)" />
      <rect x="7" y="15.5" width="5" height="3.5" rx="1" fill="rgba(255,255,255,0.62)" />
      <rect x="13.5" y="15.5" width="5" height="3.5" rx="1" fill="rgba(255,255,255,0.62)" />
      <rect x="20" y="15.5" width="5" height="3.5" rx="1" fill="rgba(255,255,255,0.95)" />
      <rect x="7" y="21" width="12" height="3.5" rx="1" fill="rgba(255,255,255,0.62)" />
    </svg>
  )
}