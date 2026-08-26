import { describe, expect, it } from 'vitest'

import { buildExternalKey, gameInputSchema } from '@/lib/games/types'

describe('buildExternalKey', () => {
  it('supabase/seed/games.example.sql 의 수기 등록 키와 같은 문자열을 만든다', () => {
    expect(
      buildExternalKey({ gameDate: '2026-04-01', awayTeamId: 'OB', homeTeamId: 'LG' }),
    ).toBe('2026-04-01-OB-LG-0')
  })

  it('더블헤더는 순번으로 구분된다', () => {
    const base = { gameDate: '2026-04-01', awayTeamId: 'OB', homeTeamId: 'LG' }

    expect(buildExternalKey({ ...base, doubleHeader: 0 })).toBe('2026-04-01-OB-LG-0')
    expect(buildExternalKey({ ...base, doubleHeader: 1 })).toBe('2026-04-01-OB-LG-1')
  })

  it('홈/원정이 뒤바뀌면 다른 경기다', () => {
    const away = buildExternalKey({ gameDate: '2026-04-01', awayTeamId: 'OB', homeTeamId: 'LG' })
    const home = buildExternalKey({ gameDate: '2026-04-01', awayTeamId: 'LG', homeTeamId: 'OB' })

    expect(away).not.toBe(home)
  })
})

describe('gameInputSchema', () => {
  const valid = {
    season: 2026,
    gameDate: '2026-04-01',
    startTime: '18:30',
    homeTeamId: 'LG',
    awayTeamId: 'OB',
    stadium: '잠실',
  }

  it('생략한 필드는 기본값으로 채운다', () => {
    const parsed = gameInputSchema.parse({
      season: 2026,
      gameDate: '2026-04-01',
      homeTeamId: 'LG',
      awayTeamId: 'OB',
    })

    expect(parsed.startTime).toBeNull()
    expect(parsed.stadium).toBeNull()
    expect(parsed.status).toBe('scheduled')
    expect(parsed.doubleHeader).toBe(0)
  })

  it('날짜 형식이 어긋나면 거절한다', () => {
    expect(gameInputSchema.safeParse({ ...valid, gameDate: '2026/04/01' }).success).toBe(false)
  })

  it('시간 형식이 어긋나면 거절한다', () => {
    expect(gameInputSchema.safeParse({ ...valid, startTime: '6:30 PM' }).success).toBe(false)
  })
})
