import Link from 'next/link'
import { notFound } from 'next/navigation'

import { GameCard } from '@/components/GameCard'
import { JoinForm } from '@/components/JoinForm'
import { MonthNav } from '@/components/MonthNav'
import { RemoveGameButton } from '@/components/RemoveGameButton'
import { ShareLink } from '@/components/ShareLink'
import { TallyCalendar } from '@/components/TallyCalendar'
import { TallyTable } from '@/components/TallyTable'
import { ViewToggle, readView } from '@/components/ViewToggle'
import { VoteToggle } from '@/components/VoteToggle'
import { monthRange, parseYearMonth, yearMonthOf } from '@/lib/calendar'
import { withParams } from '@/lib/url'
import { todayIso } from '@/lib/format'
import { getTeams } from '@/lib/games/query'
import { getRoomDetail } from '@/lib/rooms/queries'
import { tallyRoom } from '@/lib/rooms/tally'
import type { VoteValue } from '@/lib/rooms/types'

export default async function RoomPage(props: PageProps<'/rooms/[slug]'>) {
  const { slug } = await props.params
  const searchParams = await props.searchParams
  const detail = await getRoomDetail(slug)
  if (!detail) notFound()

  const { room, games, participants, votes, me, isOwner } = detail
  const teams = await getTeams()
  const teamsById = new Map(teams.map((team) => [team.id, team]))

  const summary = tallyRoom({ games, participants, votes })

  const view = readView(searchParams)
  const today = todayIso()
  // 달력 기본 위치는 후보 경기 중 가장 이른 달. 후보가 없으면 이번 달.
  const earliest = games.reduce<string | null>(
    (min, game) => (min === null || game.game_date < min ? game.game_date : min),
    null,
  )
  const yearMonth =
    parseYearMonth(typeof searchParams.month === 'string' ? searchParams.month : null) ??
    yearMonthOf(earliest ?? today)
  const range = monthRange(yearMonth)

  const rawDate = typeof searchParams.date === 'string' ? searchParams.date : null
  const selectedDate = rawDate && rawDate >= range.from && rawDate <= range.to ? rawDate : null

  const myVotes = new Map<string, VoteValue>(
    votes.filter((v) => v.participant_id === me?.id).map((v) => [v.game_id, v.value]),
  )

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{room.title}</h1>
        <ShareLink slug={room.slug} title={room.title} />
        <p className="text-sm text-muted">
          참가자 {summary.participantCount}명 중 {summary.respondedCount}명 응답
        </p>
      </header>

      {me ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-medium">
              내 응답 <span className="text-sm text-muted">({me.nickname})</span>
            </h2>
            <p className="text-xs text-muted">O 갈 수 있어요 · △ 아마도 · X 안 돼요</p>
          </div>

          {games.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
              아직 후보 경기가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  teamsById={teamsById}
                  corner={isOwner ? <RemoveGameButton slug={room.slug} gameId={game.id} /> : null}
                  action={
                    <VoteToggle
                      slug={room.slug}
                      gameId={game.id}
                      current={myVotes.get(game.id) ?? null}
                    />
                  }
                />
              ))}
            </div>
          )}

          {isOwner && (
            <Link
              href={`/rooms/${room.slug}/add`}
              className="flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-sm hover:bg-surface-muted sm:inline-flex"
            >
              + 후보 경기 더 담기
            </Link>
          )}
        </section>
      ) : (
        <JoinForm slug={room.slug} />
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">모두의 응답</h2>
          {summary.participantCount > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {view === 'calendar' && (
                <MonthNav
                  pathname={`/rooms/${slug}`}
                  searchParams={searchParams}
                  yearMonth={yearMonth}
                />
              )}
              <ViewToggle
                pathname={`/rooms/${slug}`}
                searchParams={searchParams}
                current={view}
                labels={{ list: '표', calendar: '달력' }}
              />
            </div>
          )}
        </div>

        {summary.participantCount === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            아직 아무도 참여하지 않았어요. 위 링크를 친구들에게 보내보세요.
          </p>
        ) : view === 'calendar' ? (
          <TallyCalendar
            summary={summary}
            participants={participants}
            teamsById={teamsById}
            yearMonth={yearMonth}
            today={today}
            selectedDate={selectedDate}
            hrefForDate={(date) =>
              withParams(`/rooms/${slug}`, searchParams, {
                date: date === selectedDate ? null : date,
              })
            }
          />
        ) : (
          <TallyTable
            summary={summary}
            participants={participants}
            teamsById={teamsById}
            meId={me?.id ?? null}
          />
        )}
      </section>
    </div>
  )
}
