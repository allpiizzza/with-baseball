import { MonthCalendar } from '@/components/MonthCalendar'
import type { YearMonth } from '@/lib/calendar'
import { formatStartTime } from '@/lib/format'
import type { Team } from '@/lib/games/types'
import type { TallyRow, TallySummary } from '@/lib/rooms/tally'

/**
 * 집계를 달력으로. "그래서 며칠에 갈까"는 결국 날짜 질문이라, 표보다 달력이
 * 답에 더 가깝다. 전원 O인 날은 초록으로 칠해 한눈에 띄게 한다.
 */
function TallyChip({
  row,
  teamsById,
  participantCount,
}: {
  row: TallyRow
  teamsById: Map<string, Team>
  participantCount: number
}) {
  const home = teamsById.get(row.game.home_team_id)
  const away = teamsById.get(row.game.away_team_id)

  return (
    <div
      className={`rounded border-l-2 px-1.5 py-1 text-[11px] leading-tight ${
        row.everyoneIn ? 'bg-accent text-white' : 'bg-surface-muted'
      }`}
      style={{ borderLeftColor: row.everyoneIn ? 'transparent' : (home?.color ?? 'var(--border)') }}
      title={`${away?.name ?? ''} vs ${home?.name ?? ''} · O ${row.yes} / △ ${row.maybe} / X ${row.no}`}
    >
      <div className="font-medium">
        {away?.short_name ?? '?'}
        <span className={row.everyoneIn ? 'opacity-70' : 'text-muted'}> @ </span>
        {home?.short_name ?? '?'}
      </div>
      <div className={row.everyoneIn ? 'opacity-90' : 'text-muted'}>
        {formatStartTime(row.game.start_time)}
      </div>
      <div className={`font-semibold tabular-nums ${row.everyoneIn ? '' : 'text-accent'}`}>
        {row.everyoneIn ? '🎉 ' : ''}O {row.yes}/{participantCount}
      </div>
    </div>
  )
}

export function TallyCalendar({
  summary,
  teamsById,
  yearMonth,
  today,
}: {
  summary: TallySummary
  teamsById: Map<string, Team>
  yearMonth: YearMonth
  today: string
}) {
  const byDate: Record<string, TallyRow[]> = {}
  for (const row of summary.rows) {
    ;(byDate[row.game.game_date] ??= []).push(row)
  }

  const cells = Object.fromEntries(
    Object.entries(byDate).map(([date, rows]) => [
      date,
      <>
        {rows.map((row) => (
          <TallyChip
            key={row.game.id}
            row={row}
            teamsById={teamsById}
            participantCount={summary.participantCount}
          />
        ))}
      </>,
    ]),
  )

  return <MonthCalendar yearMonth={yearMonth} cells={cells} today={today} />
}
