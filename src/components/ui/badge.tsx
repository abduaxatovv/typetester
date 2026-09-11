import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium outline-none',
  {
    variants: {
      variant: {
        default: 'bg-accent-soft text-accent',
        secondary: 'bg-surface text-muted border border-border',
        success: 'bg-emerald-500/10 text-emerald-400',
        danger: 'bg-red-500/10 text-red-400',
        neutral: 'bg-bg-inset text-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants } // oxlint-disable-line react/only-export-components