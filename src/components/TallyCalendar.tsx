import { MonthCalendar } from '@/components/MonthCalendar'
import type { YearMonth } from '@/lib/calendar'
import { formatGameDate, formatStartTime } from '@/lib/format'
import type { Team } from '@/lib/games/types'
import type { TallyRow, TallySummary } from '@/lib/rooms/tally'
import { VOTE_LABEL } from '@/lib/rooms/types'
import type { Participant } from '@/lib/rooms/types'

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

/** 좁은 화면 셀 요약 — 그날 가장 잘 맞는 경기의 O 수만. */
function DaySummary({ rows, participantCount }: { rows: TallyRow[]; participantCount: number }) {
  const best = rows.reduce((a, b) => (b.yes > a.yes ? b : a))
  const allIn = rows.some((row) => row.everyoneIn)

  return (
    <span
      className={`inline-block rounded px-1 py-0.5 text-[10px] font-semibold leading-none tabular-nums ${
        allIn ? 'bg-accent text-white' : 'bg-surface-muted text-accent'
      }`}
    >
      {allIn ? '🎉' : ''}
      {best.yes}/{participantCount}
    </span>
  )
}

export function TallyCalendar({
  summary,
  participants,
  teamsById,
  yearMonth,
  today,
  selectedDate,
  hrefForDate,
}: {
  summary: TallySummary
  participants: Participant[]
  teamsById: Map<string, Team>
  yearMonth: YearMonth
  today: string
  selectedDate: string | null
  hrefForDate: (date: string) => string
}) {
  const byDate: Record<string, TallyRow[]> = {}
  for (const row of summary.rows) {
    ;(byDate[row.game.game_date] ??= []).push(row)
  }

  const cells = Object.fromEntries(
    Object.entries(byDate).map(([date, rows]) => [
      date,
      {
        summary: <DaySummary rows={rows} participantCount={summary.participantCount} />,
        detail: rows.map((row) => (
          <TallyChip
            key={row.game.id}
            row={row}
            teamsById={teamsById}
            participantCount={summary.participantCount}
          />
        )),
      },
    ]),
  )

  const selectedRows = selectedDate ? (byDate[selectedDate] ?? []) : []

  return (
    <div className="space-y-4">
      <MonthCalendar
        yearMonth={yearMonth}
        cells={cells}
        today={today}
        selectedDate={selectedDate}
        hrefForDate={hrefForDate}
      />

      {/* 좁은 화면 셀에는 O 개수만 들어가므로, 고른 날은 누가 뭘 찍었는지까지 편다. */}
      {selectedDate && selectedRows.length > 0 && (
        <section className="space-y-2 sm:hidden">
          <h3 className="text-sm font-medium">{formatGameDate(selectedDate)}</h3>
          {selectedRows.map((row) => {
            const home = teamsById.get(row.game.home_team_id)
            const away = teamsById.get(row.game.away_team_id)
            return (
              <div
                key={row.game.id}
                className={`rounded-xl border p-3 ${
                  row.everyoneIn ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  {away?.short_name ?? '?'} vs {home?.short_name ?? '?'}
                  {row.everyoneIn && (
                    <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-white">
                      🎉 다 돼요
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {formatStartTime(row.game.start_time)}
                  {row.game.stadium ? ` · ${row.game.stadium}` : ''}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {participants.map((participant) => {
                    const value = row.byParticipant[participant.id]
                    return (
                      <span
                        key={participant.id}
                        className="rounded-full bg-surface-muted px-2 py-1 text-xs"
                      >
                        {participant.nickname}{' '}
                        <span className={value === 'yes' ? 'font-semibold text-accent' : 'text-muted'}>
                          {value ? VOTE_LABEL[value] : '–'}
                        </span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
