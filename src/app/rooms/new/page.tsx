import { GameFilters } from '@/components/GameFilters'
import { RoomBuilder } from '@/components/RoomBuilder'
import { readFilters } from '@/lib/games/filters'
import { getTeams, listGames, listStadiums } from '@/lib/games/query'

export default async function NewRoomPage(props: PageProps<'/rooms/new'>) {
  const searchParams = await props.searchParams
  const values = readFilters(searchParams)

  const [teams, stadiums, games] = await Promise.all([
    getTeams(),
    listStadiums(),
    listGames({
      teamIds: values.teamIds,
      from: values.from || null,
      to: values.to || null,
      side: values.side,
      stadium: values.stadium || null,
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">방 만들기</h1>
        <p className="mt-1 text-sm text-muted">
          같이 갈 만한 경기를 후보로 담고, 만들어진 링크를 친구들에게 보내세요.
          필터를 바꿔도 담아둔 경기는 그대로 있습니다.
        </p>
      </div>

      <GameFilters teams={teams} stadiums={stadiums} values={values} />

      <RoomBuilder games={games} teams={teams} />
    </div>
  )
}
