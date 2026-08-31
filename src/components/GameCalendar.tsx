import { CountPill, MonthCalendar } from '@/components/MonthCalendar'
import { GameCard } from '@/components/GameCard'
import type { YearMonth } from '@/lib/calendar'
import { formatGameDate, formatStartTime } from '@/lib/format'
import { perspectiveOf } from '@/lib/games/perspective'
import type { Game, Team } from '@/lib/games/types'

/** 큰 화면 셀에 들어가는 경기 한 줄. 홈팀 색으로 왼쪽에 띠를 둔다. */
function GameChip({ game, teamsById }: { game: Game; teamsById: Map<string, Team> }) {
  const home = teamsById.get(game.home_team_id)
  const away = teamsById.get(game.away_team_id)

  return (
    <div
      className={`rounded border-l-2 bg-surface-muted px-1.5 py-1 text-[11px] leading-tight ${
        isOff(game) ? 'opacity-50 line-through' : ''
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

function isOff(game: Game) {
  return game.status === 'canceled' || game.status === 'postponed'
}

/** 홈이면 초록, 원정이면 회색. 한 글자라 좁은 셀에도 들어간다. */
export function HomeAwayBadge({ isHome, size = 'sm' }: { isHome: boolean; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-block shrink-0 rounded font-semibold ${
        size === 'md' ? 'px-1.5 py-0.5 text-xs' : 'px-1 py-px text-[10px]'
      } ${isHome ? 'bg-accent text-white' : 'border border-border text-muted'}`}
    >
      {isHome ? '홈' : '원정'}
    </span>
  )
}

/**
 * 팀을 하나만 골랐을 때 쓰는 칩.
 *
 * "두산 @ LG" 는 내 팀이 어느 쪽인지 매번 읽어야 한다. 한 팀만 보고 있다면
 * 궁금한 건 셋뿐이다 — 상대가 누구고, 홈이냐 원정이냐, 원정이면 어디로 가느냐.
 */
function TeamGameChip({
  game,
  focusTeamId,
  teamsById,
}: {
  game: Game
  focusTeamId: string
  teamsById: Map<string, Team>
}) {
  const view = perspectiveOf(game, focusTeamId)
  if (!view) return <GameChip game={game} teamsById={teamsById} />

  const opponent = teamsById.get(view.opponentId)

  return (
    <div
      className={`rounded border-l-2 bg-surface-muted px-1.5 py-1 text-[11px] leading-tight ${
        isOff(game) ? 'opacity-50 line-through' : ''
      }`}
      style={{ borderLeftColor: opponent?.color ?? 'var(--border)' }}
      title={`${view.isHome ? '홈' : '원정'} · ${opponent?.name ?? ''}${
        game.stadium ? ` · ${game.stadium}` : ''
      }`}
    >
      <div className="flex items-center gap-1 font-medium">
        <HomeAwayBadge isHome={view.isHome} />
        <span className="truncate">{opponent?.short_name ?? '?'}</span>
      </div>
      <div className="text-muted">
        {/* 원정이면 어디로 가는지가 핵심 정보다. 홈이면 굳이 반복하지 않는다. */}
        {!view.isHome && view.placeLabel ? `${view.placeLabel} · ` : ''}
        {formatStartTime(game.start_time)}
      </div>
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
  focusTeamId = null,
}: {
  games: Game[]
  teamsById: Map<string, Team>
  yearMonth: YearMonth
  today: string
  selectedDate: string | null
  hrefForDate: (date: string) => string
  /** 팀을 딱 하나만 골랐을 때 그 팀. 그 팀 관점으로 칩을 그린다. */
  focusTeamId?: string | null
}) {
  const byDate: Record<string, Game[]> = {}
  for (const game of games) {
    ;(byDate[game.game_date] ??= []).push(game)
  }

  const cells = Object.fromEntries(
    Object.entries(byDate).map(([date, dayGames]) => [
      date,
      {
        // 한 팀만 보면 하루 한 경기라 좁은 화면에서도 상대·홈원정이 들어간다.
        summary:
          focusTeamId && dayGames.length === 1 ? (
            <FocusSummary game={dayGames[0]} focusTeamId={focusTeamId} teamsById={teamsById} />
          ) : (
            <CountPill count={dayGames.length} />
          ),
        detail: dayGames.map((game) =>
          focusTeamId ? (
            <TeamGameChip
              key={game.id}
              game={game}
              focusTeamId={focusTeamId}
              teamsById={teamsById}
            />
          ) : (
            <GameChip key={game.id} game={game} teamsById={teamsById} />
          ),
        ),
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

      {/* 좁은 화면에서는 셀이 작으므로, 고른 날 상세를 아래에 편다. */}
      {selectedDate && (
        <section className="space-y-2 sm:hidden">
          <h2 className="text-sm font-medium">
            {formatGameDate(selectedDate)}{' '}
            <span className="text-muted">{selectedGames.length}경기</span>
          </h2>
          {selectedGames.map((game) => {
            const view = focusTeamId ? perspectiveOf(game, focusTeamId) : null
            return (
              <GameCard
                key={game.id}
                game={game}
                teamsById={teamsById}
                corner={view ? <HomeAwayBadge isHome={view.isHome} size="md" /> : null}
              />
            )
          })}
        </section>
      )}
    </div>
  )
}

/** 좁은 화면 셀 요약 — 한 팀만 볼 때. 홈/원정 배지 + 상대(원정이면 가는 곳). */
function FocusSummary({
  game,
  focusTeamId,
  teamsById,
}: {
  game: Game
  focusTeamId: string
  teamsById: Map<string, Team>
}) {
  const view = perspectiveOf(game, focusTeamId)
  if (!view) return <CountPill count={1} />

  const opponent = teamsById.get(view.opponentId)

  return (
    <div className="space-y-0.5 text-[10px] leading-tight">
      {/*
        셀 폭이 50px 남짓이라 배지와 팀 이름이 한 줄에 다 안 들어갈 때가 있다.
        자르지 않고 줄바꿈시킨다 — "원정 두" 보다 두 줄이 낫다.
      */}
      <div className="flex flex-wrap items-center gap-x-0.5 gap-y-px">
        <HomeAwayBadge isHome={view.isHome} />
        <span className="font-medium">{opponent?.short_name ?? '?'}</span>
      </div>
      {!view.isHome && view.placeLabel && <div className="text-muted">{view.placeLabel}</div>}
    </div>
  )
}
