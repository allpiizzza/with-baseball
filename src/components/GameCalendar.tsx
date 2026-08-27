import { formatStartTime } from '@/lib/format'
import type { Game, Team } from '@/lib/games/types'
import { MonthCalendar } from '@/components/MonthCalendar'
import type { YearMonth } from '@/lib/calendar'

/** 달력 한 칸에 들어가는 경기 한 줄. 홈팀 색으로 왼쪽에 띠를 둔다. */
function GameChip({ game, teamsById }: { game: Game; teamsById: Map<string, Team> }) {
  const home = teamsById.get(game.home_team_id)
  const away = teamsById.get(game.away_team_id)
  const canceled = game.status === 'canceled' || game.status === 'postponed'

  return (
    <div
      className={`rounded border-l-2 bg-surface-muted px-1.5 py-1 text-[11px] leading-tight ${
        canceled ? 'opacity-50 line-through' : ''
      }`}
      style={{ borderLeftColor: home?.color ?? 'var(--border)' }}
      title={`${away?.name ?? ''} vs ${home?.name ?? ''}${game.stadium ? ` · ${game.stadium}` : ''}`}
    >
      <div className="font-medium">
        {away?.short_name ?? '?'}
        <span className="text-muted"> @ </span>
        {home?.short_name ?? '?'}
      </div>
      <div className="text-muted">{formatStartTime(game.start_time)}</div>
    </div>
  )
}

export function GameCalendar({
  games,
  teamsById,
  yearMonth,
  today,
}: {
  games: Game[]
  teamsById: Map<string, Team>
  yearMonth: YearMonth
  today: string
}) {
  const byDate: Record<string, Game[]> = {}
  for (const game of games) {
    ;(byDate[game.game_date] ??= []).push(game)
  }

  const cells = Object.fromEntries(
    Object.entries(byDate).map(([date, dayGames]) => [
      date,
      <>
        {dayGames.map((game) => (
          <GameChip key={game.id} game={game} teamsById={teamsById} />
        ))}
      </>,
    ]),
  )

  return <MonthCalendar yearMonth={yearMonth} cells={cells} today={today} />
}
