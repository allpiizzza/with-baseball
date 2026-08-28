import { formatGameDate, formatStartTime } from '@/lib/format'
import type { Team } from '@/lib/games/types'
import type { TallySummary } from '@/lib/rooms/tally'
import { VOTE_LABEL, type Participant, type VoteValue } from '@/lib/rooms/types'

const CELL_STYLE: Record<VoteValue, string> = {
  yes: 'text-accent font-semibold',
  maybe: 'text-amber-500',
  no: 'text-muted',
}

export function TallyTable({
  summary,
  participants,
  teamsById,
  meId,
}: {
  summary: TallySummary
  participants: Participant[]
  teamsById: Map<string, Team>
  meId: string | null
}) {
  const { rows } = summary

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        후보 경기가 없습니다.
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      {/*
        참가자가 늘면 좁은 화면에서 열이 잘린다. 표를 자체 스크롤 컨테이너에 넣고
        경기 이름 열은 왼쪽에 고정해, 옆으로 밀어도 어느 경기 줄인지 잃지 않게 한다.
      */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="min-w-max overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-medium">
                  경기
                </th>
                {participants.map((participant) => (
                  <th
                    key={participant.id}
                    className={`min-w-14 px-3 py-2.5 text-center font-medium ${
                      participant.id === meId ? 'text-foreground' : ''
                    }`}
                  >
                    {participant.nickname}
                    {participant.id === meId && ' (나)'}
                  </th>
                ))}
                <th className="min-w-14 px-3 py-2.5 text-center font-medium">O</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const home = teamsById.get(row.game.home_team_id)
                const away = teamsById.get(row.game.away_team_id)
                const rowBg = row.everyoneIn ? 'bg-accent-soft' : 'bg-surface'
                return (
                  <tr
                    key={row.game.id}
                    className={`border-b border-border last:border-0 ${
                      row.everyoneIn ? 'bg-accent-soft' : ''
                    }`}
                  >
                    <td className={`sticky left-0 z-10 px-3 py-2.5 ${rowBg}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {away?.short_name ?? '?'} vs {home?.short_name ?? '?'}
                        </span>
                        {row.everyoneIn && (
                          <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-white">
                            🎉 다 돼요
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted">
                        {formatGameDate(row.game.game_date)} ·{' '}
                        {formatStartTime(row.game.start_time)}
                        {row.game.stadium ? ` · ${row.game.stadium}` : ''}
                      </div>
                    </td>
                    {participants.map((participant) => {
                      const value = row.byParticipant[participant.id]
                      return (
                        <td key={participant.id} className="px-3 py-2.5 text-center">
                          {value ? (
                            <span className={CELL_STYLE[value]}>{VOTE_LABEL[value]}</span>
                          ) : (
                            <span className="text-border">–</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-center tabular-nums text-muted">
                      {row.yes}/{summary.participantCount}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {participants.length > 2 && (
        <p className="text-right text-xs text-muted sm:hidden">옆으로 밀어서 더 보기 →</p>
      )}
    </div>
  )
}
