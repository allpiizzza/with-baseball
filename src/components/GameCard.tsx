import type { ReactNode } from 'react'

import { formatGameDate, formatStartTime } from '@/lib/format'
import type { Game, Team } from '@/lib/games/types'

export function TeamBadge({ team }: { team: Team | undefined }) {
  if (!team) return <span className="text-muted">?</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: team.color }}
      />
      {team.short_name}
    </span>
  )
}

/** 경기 한 줄. 오른쪽 슬롯에 체크박스나 O/X 토글을 끼워 쓴다. */
export function GameCard({
  game,
  teamsById,
  action,
  highlight = false,
}: {
  game: Game
  teamsById: Map<string, Team>
  action?: ReactNode
  highlight?: boolean
}) {
  const home = teamsById.get(game.home_team_id)
  const away = teamsById.get(game.away_team_id)

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 ${
        highlight ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-medium">
          <TeamBadge team={away} />
          <span className="text-muted">vs</span>
          <TeamBadge team={home} />
          {game.status !== 'scheduled' && (
            <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-muted">
              {STATUS_LABEL[game.status]}
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-muted">
          {formatGameDate(game.game_date)} · {formatStartTime(game.start_time)}
          {game.stadium ? ` · ${game.stadium}` : ''}
        </div>
      </div>
      {action}
    </div>
  )
}

const STATUS_LABEL: Record<Game['status'], string> = {
  scheduled: '예정',
  postponed: '우천취소/연기',
  canceled: '취소',
  finished: '종료',
}
