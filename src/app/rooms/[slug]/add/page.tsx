import Link from 'next/link'
import { notFound } from 'next/navigation'

import { GameFilters } from '@/components/GameFilters'
import { RoomGameAdder } from '@/components/RoomGameAdder'
import { readFilters } from '@/lib/games/filters'
import { getTeams, listGames, listStadiums } from '@/lib/games/query'
import { getRoomDetail } from '@/lib/rooms/queries'

export default async function AddGamesPage(props: PageProps<'/rooms/[slug]/add'>) {
  const { slug } = await props.params
  const searchParams = await props.searchParams

  const detail = await getRoomDetail(slug)
  if (!detail) notFound()

  if (!detail.isOwner) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">방장만 후보 경기를 바꿀 수 있어요</h1>
        <Link href={`/rooms/${slug}`} className="text-sm text-accent underline underline-offset-4">
          방으로 돌아가기
        </Link>
      </div>
    )
  }

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
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">후보 경기 더 담기</h1>
        <p className="mt-1 text-sm text-muted">
          <Link href={`/rooms/${slug}`} className="text-accent underline underline-offset-4">
            {detail.room.title}
          </Link>
          에 경기를 추가합니다.
        </p>
      </div>

      <GameFilters teams={teams} stadiums={stadiums} values={values} />

      <RoomGameAdder
        slug={slug}
        games={games}
        teams={teams}
        alreadyInRoom={detail.games.map((game) => game.id)}
      />
    </div>
  )
}
