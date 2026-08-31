import { describe, expect, it } from 'vitest'

import { perspectiveOf, stadiumLabel } from '@/lib/games/perspective'
import type { Game } from '@/lib/games/types'

function game(overrides: Partial<Game> = {}): Game {
  return {
    id: 'g1',
    season: 2026,
    game_date: '2026-09-01',
    start_time: '18:30:00',
    home_team_id: 'SS',
    away_team_id: 'LG',
    stadium: '대구 삼성 라이온즈 파크',
    status: 'scheduled',
    external_key: '2026-09-01-LG-SS-0',
    ...overrides,
  }
}

describe('stadiumLabel', () => {
  it('긴 구장 이름을 도시로 줄인다', () => {
    expect(stadiumLabel('대구 삼성 라이온즈 파크')).toBe('대구')
    expect(stadiumLabel('인천 SSG 랜더스필드')).toBe('인천')
    expect(stadiumLabel('광주-기아 챔피언스 필드')).toBe('광주')
    expect(stadiumLabel('대전 한화생명 볼파크')).toBe('대전')
    expect(stadiumLabel('창원 NC 파크')).toBe('창원')
    expect(stadiumLabel('수원 KT 위즈 파크')).toBe('수원')
  })

  it('사직은 부산으로 읽는다', () => {
    expect(stadiumLabel('사직')).toBe('부산')
    expect(stadiumLabel('부산 사직 야구장')).toBe('부산')
  })

  it('서울의 두 구장은 구장명을 유지한다 (도시로 줄이면 구분이 안 된다)', () => {
    expect(stadiumLabel('잠실')).toBe('잠실')
    expect(stadiumLabel('고척 스카이돔')).toBe('고척')
  })

  it('문학은 인천으로 읽는다', () => {
    expect(stadiumLabel('문학')).toBe('인천')
  })

  it('모르는 구장은 그대로 둔다', () => {
    expect(stadiumLabel('제3구장')).toBe('제3구장')
  })

  it('구장 정보가 없으면 null', () => {
    expect(stadiumLabel(null)).toBeNull()
    expect(stadiumLabel('')).toBeNull()
  })
})

describe('perspectiveOf', () => {
  it('홈팀 관점이면 isHome 이고 상대는 원정팀', () => {
    expect(perspectiveOf(game(), 'SS')).toEqual({
      isHome: true,
      opponentId: 'LG',
      placeLabel: '대구',
    })
  })

  it('원정팀 관점이면 isHome 이 false 이고 가는 곳이 나온다', () => {
    expect(perspectiveOf(game(), 'LG')).toEqual({
      isHome: false,
      opponentId: 'SS',
      placeLabel: '대구',
    })
  })

  it('그 팀 경기가 아니면 null', () => {
    expect(perspectiveOf(game(), 'OB')).toBeNull()
  })

  it('구장이 비어 있어도 상대·홈원정은 나온다', () => {
    expect(perspectiveOf(game({ stadium: null }), 'LG')).toEqual({
      isHome: false,
      opponentId: 'SS',
      placeLabel: null,
    })
  })
})
