import { CountPill, MonthCalendar } from '@/components/MonthCalendar'
import { GameCard } from '@/components/GameCard'
import type { YearMonth } from '@/lib/calendar'
import { formatGameDate, formatStartTime } from '@/lib/format'
import type { Game, Team } from '@/lib/games/types'

/** 큰 화면 셀에 들어가는 경기 한 줄. 홈팀 색으로 왼쪽에 띠를 둔다. */
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
  selectedDate,
  hrefForDate,
}: {
  games: Game[]
  teamsById: Map<string, Team>
  yearMonth: YearMonth
  today: string
  selectedDate: string | null
  hrefForDate: (date: string) => string
}) {
  const byDate: Record<string, Game[]> = {}
  for (const game of games) {
    ;(byDate[game.game_date] ??= []).push(game)
  }

  const cells = Object.fromEntries(
    Object.entries(byDate).map(([date, dayGames]) => [
      date,
      {
        summary: <CountPill count={dayGames.length} />,
        detail: dayGames.map((game) => (
          <GameChip key={game.id} game={game} teamsById={teamsById} />
        )),
      },
    ]),
  )

  const selectedGames = selectedDate ? (byDate[selectedDate] ?? []) : []

  return (
    <div className="space-y-4">
      <MonthCalendar
        yearMonth={yearMonth}
        cells={cells}
        today={today}
        selectedDate={selectedDate}
        hrefForDate={hrefForDate}
      />

      {/* 좁은 화면에서는 셀에 "n경기"만 들어가므로, 고른 날 상세를 아래에 편다. */}
      {selectedDate && (
        <section className="space-y-2 sm:hidden">
          <h2 className="text-sm font-medium">
            {formatGameDate(selectedDate)}{' '}
            <span className="text-muted">{selectedGames.length}경기</span>
          </h2>
          {selectedGames.map((game) => (
            <GameCard key={game.id} game={game} teamsById={teamsById} />
          ))}
        </section>
      )}
    </div>
  )
}
