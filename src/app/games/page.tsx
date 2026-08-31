import { GameCalendar } from '@/components/GameCalendar'
import { GameCard } from '@/components/GameCard'
import { GameFilters } from '@/components/GameFilters'
import { MonthNav } from '@/components/MonthNav'
import { ViewToggle, readView } from '@/components/ViewToggle'
import { monthRange, parseYearMonth, yearMonthOf } from '@/lib/calendar'
import { withParams } from '@/lib/url'
import { todayIso } from '@/lib/format'
import { readFilters } from '@/lib/games/filters'
import { getTeams, listGames, listStadiums, sanitizeTeamIds } from '@/lib/games/query'

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

  // 좁은 화면에서 날짜를 눌러 그 날 상세를 펼치기 위한 선택 상태.
  const rawDate = typeof searchParams.date === 'string' ? searchParams.date : null
  const selectedDate = rawDate && rawDate >= range.from && rawDate <= range.to ? rawDate : null

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

  // 팀을 딱 하나만 고르면 달력을 그 팀 관점으로 그린다 — 상대·홈원정·원정지.
  const selectedTeamIds = sanitizeTeamIds(values.teamIds)
  const focusTeamId = selectedTeamIds.length === 1 ? selectedTeamIds[0] : null
  const focusTeam = focusTeamId ? teamsById.get(focusTeamId) : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">경기 일정</h1>
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

      {view === 'calendar' &&
        (focusTeam ? (
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: focusTeam.color }}
              aria-hidden
            />
            <strong className="font-medium text-foreground">{focusTeam.name}</strong> 기준 —
            상대팀과 <span className="font-medium text-foreground">홈</span>·
            <span className="font-medium text-foreground">원정</span>(가는 곳)을 함께 보여줍니다.
          </p>
        ) : (
          <p className="text-sm text-muted">
            팀을 <strong className="font-medium text-foreground">하나만</strong> 고르면 그 팀
            기준으로 상대팀과 홈·원정(가는 곳)이 표시됩니다.
          </p>
        ))}

      {view === 'calendar' ? (
        <GameCalendar
          games={games}
          teamsById={teamsById}
          yearMonth={yearMonth}
          today={today}
          selectedDate={selectedDate}
          hrefForDate={(date) =>
            withParams('/games', searchParams, { date: date === selectedDate ? null : date })
          }
          focusTeamId={focusTeamId}
        />
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
