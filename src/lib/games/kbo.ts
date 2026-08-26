import type { GameInput } from '@/lib/games/types'

/**
 * KBO 공식 일정 페이지의 내부 ajax 응답을 GameInput[] 으로 바꾼다.
 *
 * 순수 함수 — 네트워크를 모른다. 응답 픽스처만으로 테스트할 수 있게 분리해 뒀다.
 *
 * ⚠️ 이 엔드포인트는 공개 API가 아니라 페이지 내부에서 쓰는 것이라 스펙 보장이 없다.
 * 그래서 열 위치를 고정하지 않고 **셀 내용의 모양으로 필드를 찾는다**. 중간에 열이
 * 하나 늘거나 순서가 바뀌어도 파싱이 통째로 깨지지 않게 하려는 것.
 * 알아보지 못한 행은 버리지 않고 warnings 로 올려보낸다.
 */

export interface KboScheduleRow {
  row: { Text: string; Class?: string }[]
}

export interface KboScheduleResponse {
  rows: KboScheduleRow[]
}

export interface ParseResult {
  games: GameInput[]
  warnings: string[]
}

/** 응답에 등장하는 팀 표기 -> DB 팀 코드 */
const TEAM_CODES: Record<string, string> = {
  LG: 'LG',
  두산: 'OB',
  KIA: 'HT',
  기아: 'HT',
  삼성: 'SS',
  롯데: 'LT',
  SSG: 'SK',
  NC: 'NC',
  키움: 'WO',
  한화: 'HH',
  KT: 'KT',
  kt: 'KT',
}

/** 응답의 짧은 구장 표기 -> 표시용 이름 */
const STADIUMS: Record<string, string> = {
  잠실: '잠실',
  고척: '고척 스카이돔',
  문학: '인천 SSG 랜더스필드',
  인천: '인천 SSG 랜더스필드',
  사직: '사직',
  대구: '대구 삼성 라이온즈 파크',
  광주: '광주-기아 챔피언스 필드',
  대전: '대전 한화생명 볼파크',
  창원: '창원 NC 파크',
  수원: '수원 KT 위즈 파크',
  울산: '울산 문수',
  포항: '포항',
  청주: '청주',
}

const DATE_CELL = /^(\d{2})\.(\d{2})/ // '04.01(수)'
const TIME_CELL = /^(\d{1,2}):(\d{2})$/ // '18:30'

export function parseScheduleResponse(raw: unknown, season: number): ParseResult {
  const games: GameInput[] = []
  const warnings: string[] = []

  const rows = (raw as KboScheduleResponse | null)?.rows
  if (!Array.isArray(rows)) {
    return { games, warnings: ['응답에 rows 배열이 없습니다. 엔드포인트 응답 형식이 바뀐 것 같습니다.'] }
  }

  // 날짜 셀은 그 날의 첫 경기 행에만 들어있고, 같은 날 나머지 경기 행에서는 비어 있다.
  let currentDate: string | null = null
  // '{날짜}|{원정}|{홈}' -> 지금까지 본 횟수. 더블헤더 순번을 매기는 데 쓴다.
  const seen = new Map<string, number>()

  for (const [index, entry] of rows.entries()) {
    const cells = (entry?.row ?? []).map((cell) => stripHtml(cell?.Text ?? ''))

    const dateCell = cells.find((text) => DATE_CELL.test(text))
    if (dateCell) currentDate = toIsoDate(dateCell, season)

    const matchup = cells.map(parseMatchup).find((m) => m !== null)
    if (!matchup) continue // 헤더 행이나 빈 행

    if (!currentDate) {
      warnings.push(`#${index}: 경기(${matchup.away} vs ${matchup.home})의 날짜를 찾지 못했습니다`)
      continue
    }

    const awayTeamId = TEAM_CODES[matchup.away]
    const homeTeamId = TEAM_CODES[matchup.home]
    if (!awayTeamId || !homeTeamId) {
      warnings.push(`#${index}: 모르는 팀 표기 (${matchup.away} vs ${matchup.home})`)
      continue
    }

    const timeCell = cells.find((text) => TIME_CELL.test(text))
    const stadiumCell = cells.find((text) => STADIUMS[text] !== undefined)

    const key = `${currentDate}|${awayTeamId}|${homeTeamId}`
    const doubleHeader = seen.get(key) ?? 0
    seen.set(key, doubleHeader + 1)

    games.push({
      season,
      gameDate: currentDate,
      startTime: timeCell ? normalizeTime(timeCell) : null,
      homeTeamId,
      awayTeamId,
      stadium: stadiumCell ? STADIUMS[stadiumCell] : null,
      status: cells.some((text) => text.includes('취소')) ? 'canceled' : 'scheduled',
      doubleHeader,
    })
  }

  return { games, warnings }
}

/** '<span>두산</span><em>vs</em><span>LG</span>' -> { away: '두산', home: 'LG' } */
function parseMatchup(text: string): { away: string; home: string } | null {
  const match = /^(.+?)\s*vs\s*(.+?)$/i.exec(text.trim())
  if (!match) return null

  // 스코어가 붙어 나오는 경우가 있다: '두산 3 vs 5 LG'
  const away = match[1].replace(/[\d\s]+$/, '').trim()
  const home = match[2].replace(/^[\d\s]+/, '').trim()
  if (!away || !home) return null
  return { away, home }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** '04.01(수)' + 2026 -> '2026-04-01' */
function toIsoDate(cell: string, season: number): string {
  const match = DATE_CELL.exec(cell)!
  return `${season}-${match[1]}-${match[2]}`
}

/** '8:30' -> '08:30' */
function normalizeTime(cell: string): string {
  const match = TIME_CELL.exec(cell)!
  return `${match[1].padStart(2, '0')}:${match[2]}`
}
