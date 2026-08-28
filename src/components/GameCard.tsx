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

/**
 * 경기 한 줄.
 *
 * 모바일에서는 정보와 조작을 위아래로 쌓는다 — 구장 이름 길이에 따라 버튼이
 * 올라갔다 내려갔다 하면 목록을 훑기 어렵다. 큰 화면에서는 한 줄로 붙인다.
 */
export function GameCard({
  game,
  teamsById,
  action,
  corner,
  highlight = false,
}: {
  game: Game
  teamsById: Map<string, Team>
  action?: ReactNode
  /** 오른쪽 위 구석 자리. 삭제처럼 주 조작에서 떼어놓고 싶은 것에 쓴다. */
  corner?: ReactNode
  highlight?: boolean
}) {
  const home = teamsById.get(game.home_team_id)
  const away = teamsById.get(game.away_team_id)

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between ${
        highlight ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
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
        {corner && <div className="-mt-1 shrink-0">{corner}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

const STATUS_LABEL: Record<Game['status'], string> = {
  scheduled: '예정',
  postponed: '우천취소/연기',
  canceled: '취소',
  finished: '종료',
}
