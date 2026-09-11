import * as React from 'react'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value?: number }>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-surface', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-accent transition-all duration-150"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  ),
)
Progress.displayName = 'Progress'

export { Progress }