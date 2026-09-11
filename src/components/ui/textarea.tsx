import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[120px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }