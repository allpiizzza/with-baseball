import type { Game } from '@/lib/games/types'
import type { Participant, VoteRecord, VoteValue } from '@/lib/rooms/types'

export interface TallyRow {
  game: Game
  yes: number
  maybe: number
  no: number
  /** 아직 이 경기에 응답하지 않은 참가자 수 */
  pending: number
  /** 참가자가 한 명 이상이고, 전원이 O를 찍었는가 */
  everyoneIn: boolean
  /** participantId -> 투표값. 응답이 없으면 키가 없다. */
  byParticipant: Record<string, VoteValue>
}

export interface TallySummary {
  rows: TallyRow[]
  participantCount: number
  /** 한 표라도 던진 참가자 수 */
  respondedCount: number
}

/**
 * 방의 투표 현황을 집계한다. 순수 함수 — DB를 모른다.
 *
 * 정렬은 "그래서 언제 갈까"에 바로 답하도록 맞춰져 있다:
 * 전원 O인 경기가 최상단 → O 많은 순 → △ 많은 순 → 날짜 빠른 순.
 */
export function tallyRoom(input: {
  games: Game[]
  participants: Participant[]
  votes: VoteRecord[]
}): TallySummary {
  const { games, participants, votes } = input
  const participantIds = new Set(participants.map((p) => p.id))

  const byGame = new Map<string, Record<string, VoteValue>>()
  const responded = new Set<string>()

  for (const vote of votes) {
    // 방에서 나간(삭제된) 참가자의 표는 무시한다.
    if (!participantIds.has(vote.participant_id)) continue

    let bucket = byGame.get(vote.game_id)
    if (!bucket) {
      bucket = {}
      byGame.set(vote.game_id, bucket)
    }
    bucket[vote.participant_id] = vote.value
    responded.add(vote.participant_id)
  }

  const rows: TallyRow[] = games.map((game) => {
    const byParticipant = byGame.get(game.id) ?? {}
    let yes = 0
    let maybe = 0
    let no = 0

    for (const participant of participants) {
      const value = byParticipant[participant.id]
      if (value === 'yes') yes += 1
      else if (value === 'maybe') maybe += 1
      else if (value === 'no') no += 1
    }

    const answered = yes + maybe + no
    return {
      game,
      yes,
      maybe,
      no,
      pending: participants.length - answered,
      everyoneIn: participants.length > 0 && yes === participants.length,
      byParticipant,
    }
  })

  rows.sort((a, b) => {
    if (a.everyoneIn !== b.everyoneIn) return a.everyoneIn ? -1 : 1
    if (a.yes !== b.yes) return b.yes - a.yes
    if (a.maybe !== b.maybe) return b.maybe - a.maybe
    if (a.game.game_date !== b.game.game_date) {
      return a.game.game_date < b.game.game_date ? -1 : 1
    }
    return (a.game.start_time ?? '').localeCompare(b.game.start_time ?? '')
  })

  return {
    rows,
    participantCount: participants.length,
    respondedCount: responded.size,
  }
}
