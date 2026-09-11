import { useDataStore } from '@/store/dataStore'
import { ACHIEVEMENTS } from '@/store/achievements'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function Achievements() {
  const achievements = useDataStore((s) => s.achievements)
  const unlockedCount = Object.keys(achievements).length
  const progress = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Achievements</h1>
        <Badge variant="secondary">
          {unlockedCount} / {ACHIEVEMENTS.length} unlocked
        </Badge>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const prog = achievements[a.id]
          const unlocked = Boolean(prog)
          return (
            <Card
              key={a.id}
              className={cn(
                'transition-opacity',
                unlocked ? '' : 'opacity-45',
              )}
            >
              <CardContent className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{a.icon}</span>
                  {unlocked ? (
                    <Badge variant="success">Unlocked</Badge>
                  ) : (
                    <Badge variant="neutral">Locked</Badge>
                  )}
                </div>
                <div className="mt-1 text-sm font-semibold">{a.name}</div>
                <div className="text-xs leading-snug text-muted">{a.description}</div>
                {unlocked && prog ? (
                  <div className="text-[11px] text-faint">
                    {new Date(prog.unlockedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}