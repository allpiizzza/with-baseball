import { GameCalendar } from '@/components/GameCalendar'
import { GameCard } from '@/components/GameCard'
import { GameFilters } from '@/components/GameFilters'
import { MonthNav } from '@/components/MonthNav'
import { ViewToggle, readView } from '@/components/ViewToggle'
import { monthRange, parseYearMonth, yearMonthOf } from '@/lib/calendar'
import { todayIso } from '@/lib/format'
import { readFilters } from '@/lib/games/filters'
import { getTeams, listGames, listStadiums } from '@/lib/games/query'

export default async function GamesPage(props: PageProps<'/games'>) {
  const searchParams = await props.searchParams
  const view = readView(searchParams)
  const values = readFilters(searchParams)
  const today = todayIso()

  // 달력은 월 단위로 움직인다. 날짜 범위는 필터가 아니라 보고 있는 달이 정한다.
  const yearMonth =
    parseYearMonth(typeof searchParams.month === 'string' ? searchParams.month : null) ??
    yearMonthOf(values.from || today)
  const range = monthRange(yearMonth)

  const [teams, stadiums, games] = await Promise.all([
    getTeams(),
    listStadiums(),
    listGames({
      teamIds: values.teamIds,
      from: view === 'calendar' ? range.from : values.from || null,
      to: view === 'calendar' ? range.to : values.to || null,
      side: values.side,
      stadium: values.stadium || null,
    }),
  ])

  const teamsById = new Map(teams.map((team) => [team.id, team]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">경기 일정</h1>
        <p className="mt-1 text-sm text-muted">
          응원하는 팀만 골라서 보세요. 필터는 주소에 남으니 링크로 그대로 공유할 수 있어요.
        </p>
      </div>

      <GameFilters teams={teams} stadiums={stadiums} values={values} hideDateRange={view === 'calendar'} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle pathname="/games" searchParams={searchParams} current={view} />
        {view === 'calendar' ? (
          <MonthNav pathname="/games" searchParams={searchParams} yearMonth={yearMonth} />
        ) : (
          <p className="text-sm text-muted">{games.length}경기</p>
        )}
      </div>

      {view === 'calendar' ? (
        <GameCalendar games={games} teamsById={teamsById} yearMonth={yearMonth} today={today} />
      ) : games.length === 0 ? (
        <EmptyState hasFilters={values.teamIds.length > 0 || Boolean(values.stadium)} />
      ) : (
        <div className="space-y-2">
          {games.map((game) => (
            <GameCard key={game.id} game={game} teamsById={teamsById} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
      {hasFilters ? (
        <>조건에 맞는 경기가 없어요. 필터를 조금 풀어보세요.</>
      ) : (
        <>
          등록된 경기가 없습니다.
          <br />
          Supabase SQL Editor에서 <code className="text-foreground">supabase/seed/games.example.sql</code> 을
          실행해 일정을 넣어주세요.
        </>
      )}
    </div>
  )
}
