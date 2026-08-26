import { describe, expect, it } from 'vitest'

import fixture from '@/lib/games/__tests__/fixtures/kbo-schedule.json'
import { parseScheduleResponse } from '@/lib/games/kbo'
import { buildExternalKey } from '@/lib/games/types'

describe('parseScheduleResponse', () => {
  const { games, warnings } = parseScheduleResponse(fixture, 2026)

  it('경기를 팀 코드와 함께 뽑아낸다', () => {
    expect(games[0]).toMatchObject({
      season: 2026,
      gameDate: '2026-04-01',
      startTime: '18:30',
      awayTeamId: 'OB',
      homeTeamId: 'LG',
      stadium: '잠실',
      status: 'scheduled',
      doubleHeader: 0,
    })
  })

  it('날짜 셀이 없는 행은 직전 날짜를 이어받는다', () => {
    // 같은 4/1 의 두 번째 경기 — 응답에 날짜 셀이 없다.
    expect(games[1]).toMatchObject({
      gameDate: '2026-04-01',
      awayTeamId: 'SS',
      homeTeamId: 'HT',
    })
  })

  it('같은 날 같은 카드는 더블헤더 순번이 올라간다', () => {
    const doubleHeader = games.filter(
      (g) => g.gameDate === '2026-04-02' && g.awayTeamId === 'WO' && g.homeTeamId === 'SK',
    )

    expect(doubleHeader.map((g) => g.doubleHeader)).toEqual([0, 1])
    expect(
      doubleHeader.map((g) =>
        buildExternalKey({
          gameDate: g.gameDate,
          awayTeamId: g.awayTeamId,
          homeTeamId: g.homeTeamId,
          doubleHeader: g.doubleHeader,
        }),
      ),
    ).toEqual(['2026-04-02-WO-SK-0', '2026-04-02-WO-SK-1'])
  })

  it('우천취소는 status 로 표시한다', () => {
    const canceled = games.find((g) => g.awayTeamId === 'HH' && g.homeTeamId === 'LT')

    expect(canceled?.status).toBe('canceled')
  })

  it('시간 셀이 없으면 startTime 은 null 이다', () => {
    const noTime = games.find((g) => g.awayTeamId === 'NC' && g.homeTeamId === 'KT')

    expect(noTime?.startTime).toBeNull()
    expect(noTime?.stadium).toBe('수원 KT 위즈 파크')
  })

  it('모르는 팀 표기는 버리지 않고 경고로 알린다', () => {
    expect(games.some((g) => g.gameDate === '2026-04-03' && g.stadium === null)).toBe(false)
    expect(warnings.some((w) => w.includes('고양'))).toBe(true)
  })

  it('응답 형식이 아예 다르면 경고만 남기고 조용히 끝낸다', () => {
    const result = parseScheduleResponse({ unexpected: true }, 2026)

    expect(result.games).toEqual([])
    expect(result.warnings).toHaveLength(1)
  })
})
