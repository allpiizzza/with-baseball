import type { Game } from '@/lib/games/types'

/**
 * 구장 이름 -> 짧은 지역 이름.
 *
 * "9/5 대구" 처럼 어디로 가는지가 한눈에 들어와야 하는 자리에 쓴다.
 * 서울에는 구장이 둘(잠실·고척)이라 그 둘만 구장명을 그대로 쓰고,
 * 나머지는 도시 이름으로 줄인다.
 *
 * 부분 문자열로 찾기 때문에 '사직', '사직야구장', '부산 사직' 이 모두 '부산'이 된다.
 * 모르는 구장은 손대지 않고 그대로 돌려준다 — 임시 구장이 생겨도 화면이 비지 않는다.
 */
const STADIUM_RULES: readonly (readonly [string, string])[] = [
  ['잠실', '잠실'],
  ['고척', '고척'],
  ['문학', '인천'],
  ['인천', '인천'],
  ['사직', '부산'],
  ['부산', '부산'],
  ['대구', '대구'],
  ['광주', '광주'],
  ['대전', '대전'],
  ['창원', '창원'],
  ['마산', '창원'],
  ['수원', '수원'],
  ['울산', '울산'],
  ['포항', '포항'],
  ['청주', '청주'],
]

export function stadiumLabel(stadium: string | null): string | null {
  if (!stadium) return null
  for (const [needle, label] of STADIUM_RULES) {
    if (stadium.includes(needle)) return label
  }
  return stadium
}

export interface Perspective {
  /** 이 팀의 홈경기인가 */
  isHome: boolean
  /** 상대 팀 id */
  opponentId: string
  /** 경기가 열리는 곳(짧은 이름). 구장 정보가 없으면 null. */
  placeLabel: string | null
}

/**
 * 경기를 특정 팀 관점으로 바꿔 본다.
 *
 * 팀을 하나만 골랐을 때 달력이 "두산 @ LG" 대신 "홈 · 두산" / "원정 · 대구" 로
 * 보이게 하는 데 쓴다. 그 팀 경기가 아니면 null.
 */
export function perspectiveOf(game: Game, teamId: string): Perspective | null {
  const isHome = game.home_team_id === teamId
  const isAway = game.away_team_id === teamId
  if (!isHome && !isAway) return null

  return {
    isHome,
    opponentId: isHome ? game.away_team_id : game.home_team_id,
    placeLabel: stadiumLabel(game.stadium),
  }
}
