import { describe, expect, it } from 'vitest'

import type { Game } from '@/lib/games/types'
import { tallyRoom } from '@/lib/rooms/tally'
import type { Participant, VoteRecord } from '@/lib/rooms/types'

function game(id: string, date: string, startTime: string | null = '18:30:00'): Game {
  return {
    id,
    season: 2026,
    game_date: date,
    start_time: startTime,
    home_team_id: 'LG',
    away_team_id: 'OB',
    stadium: '잠실',
    status: 'scheduled',
    external_key: `${date}-OB-LG-0`,
  }
}

function person(id: string, nickname: string): Participant {
  return { id, nickname, created_at: '2026-03-01T00:00:00Z' }
}

function vote(participantId: string, gameId: string, value: VoteRecord['value']): VoteRecord {
  return { participant_id: participantId, game_id: gameId, value }
}

describe('tallyRoom', () => {
  const games = [game('g1', '2026-04-01'), game('g2', '2026-04-02'), game('g3', '2026-04-03')]
  const participants = [person('p1', '민수'), person('p2', '지연')]

  it('전원이 O를 찍은 경기를 맨 위로 올린다', () => {
    const summary = tallyRoom({
      games,
      participants,
      votes: [
        vote('p1', 'g1', 'yes'),
        vote('p2', 'g1', 'no'),
        vote('p1', 'g3', 'yes'),
        vote('p2', 'g3', 'yes'),
      ],
    })

    expect(summary.rows[0].game.id).toBe('g3')
    expect(summary.rows[0].everyoneIn).toBe(true)
    expect(summary.rows.slice(1).every((row) => !row.everyoneIn)).toBe(true)
  })

  it('O 개수를 세고 미응답을 pending 으로 남긴다', () => {
    const summary = tallyRoom({
      games: [games[0]],
      participants,
      votes: [vote('p1', 'g1', 'yes')],
    })

    const row = summary.rows[0]
    expect(row.yes).toBe(1)
    expect(row.no).toBe(0)
    expect(row.pending).toBe(1)
    expect(row.everyoneIn).toBe(false)
  })

  it('O 수가 같으면 △ 많은 쪽, 그다음 날짜 빠른 쪽이 위로 온다', () => {
    const summary = tallyRoom({
      games,
      participants,
      votes: [
        // g2: O 1 + △ 1, g3: O 1 + X 1  -> g2 가 위
        vote('p1', 'g2', 'yes'),
        vote('p2', 'g2', 'maybe'),
        vote('p1', 'g3', 'yes'),
        vote('p2', 'g3', 'no'),
      ],
    })

    expect(summary.rows.map((row) => row.game.id)).toEqual(['g2', 'g3', 'g1'])
  })

  it('참가자가 없으면 everyoneIn 은 false 다', () => {
    const summary = tallyRoom({ games: [games[0]], participants: [], votes: [] })

    expect(summary.rows[0].everyoneIn).toBe(false)
    expect(summary.participantCount).toBe(0)
  })

  it('방에서 빠진 참가자의 표는 세지 않는다', () => {
    const summary = tallyRoom({
      games: [games[0]],
      participants: [person('p1', '민수')],
      votes: [vote('p1', 'g1', 'yes'), vote('ghost', 'g1', 'yes')],
    })

    expect(summary.rows[0].yes).toBe(1)
    expect(summary.rows[0].byParticipant).toEqual({ p1: 'yes' })
    expect(summary.respondedCount).toBe(1)
  })

  it('한 표라도 던진 사람 수를 센다', () => {
    const summary = tallyRoom({
      games,
      participants,
      votes: [vote('p1', 'g1', 'no'), vote('p1', 'g2', 'yes')],
    })

    expect(summary.participantCount).toBe(2)
    expect(summary.respondedCount).toBe(1)
  })
})
