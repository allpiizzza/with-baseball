/**
 * KBO 공식 일정을 월 단위로 긁어 games 테이블에 넣는다 (Path B).
 *
 *   npm run import:kbo -- --season 2026 --months 3,4,5
 *
 * ⚠️ koreabaseball.com 은 공개 API를 제공하지 않는다. 이 스크립트는 일정 페이지가
 * 내부적으로 쓰는 ajax 엔드포인트를 호출한다. 스펙 보장이 없으므로 언제든 형식이
 * 바뀔 수 있고, 그때는 파싱이 실패하며 경고를 찍는다. 앱 자체는 이 스크립트 없이도
 * 동작한다 — 경기는 Supabase에서 직접 넣을 수 있다(supabase/seed/games.example.sql).
 *
 * 상대 서버에 부담을 주지 않도록 월 사이에 딜레이를 두고, User-Agent 를 밝힌다.
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const { parseScheduleResponse } = await import('@/lib/games/kbo')
const { upsertGames } = await import('@/lib/games/upsert')

const ENDPOINT = 'https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList'
const USER_AGENT = 'with-baseball/0.1 (schedule importer; contact: repo owner)'
const DELAY_MS = 1500

async function main() {
  const { season, months } = readArgs()
  console.log(`${season}시즌 ${months.join(', ')}월 일정을 가져옵니다.`)

  let total = 0
  for (const [index, month] of months.entries()) {
    if (index > 0) await sleep(DELAY_MS)

    const raw = await fetchMonth(season, month)
    const { games, warnings } = parseScheduleResponse(raw, season)

    for (const warning of warnings) console.warn(`  ⚠️  ${month}월: ${warning}`)

    if (games.length === 0) {
      console.log(`  ${month}월: 경기 없음`)
      continue
    }

    const result = await upsertGames(games)
    for (const error of result.errors) console.warn(`  ⚠️  ${month}월: ${error}`)
    console.log(`  ${month}월: ${result.written}경기 저장`)
    total += result.written
  }

  console.log(`완료 — 총 ${total}경기.`)
}

async function fetchMonth(season: number, month: number): Promise<unknown> {
  const body = new URLSearchParams({
    leId: '1', // KBO 리그
    srIdList: '0,9,6', // 정규시즌 + 포스트시즌
    seasonId: String(season),
    gameMonth: String(month).padStart(2, '0'),
    teamId: '',
  })

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'User-Agent': USER_AGENT,
      Referer: 'https://www.koreabaseball.com/Schedule/Schedule.aspx',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(
      `${month}월 일정을 받지 못했습니다 (HTTP ${response.status}). ` +
        '엔드포인트가 막혔거나 형식이 바뀌었을 수 있습니다. ' +
        'supabase/seed/games.example.sql 로 직접 등록하는 방법을 README에서 확인하세요.',
    )
  }

  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      `${month}월 응답이 JSON이 아닙니다. 응답 앞부분: ${text.slice(0, 200)}`,
    )
  }
}

function readArgs(): { season: number; months: number[] } {
  const args = process.argv.slice(2)
  const get = (name: string): string | undefined => {
    const index = args.indexOf(`--${name}`)
    return index >= 0 ? args[index + 1] : undefined
  }

  const season = Number(get('season') ?? new Date().getFullYear())
  if (!Number.isInteger(season)) throw new Error('--season 은 연도(예: 2026)여야 합니다')

  const monthsArg = get('months')
  const months = monthsArg
    ? monthsArg.split(',').map((m) => Number(m.trim()))
    : [3, 4, 5, 6, 7, 8, 9, 10]

  if (months.some((m) => !Number.isInteger(m) || m < 1 || m > 12)) {
    throw new Error('--months 는 1~12 사이 숫자를 쉼표로 이어 씁니다 (예: 4,5,6)')
  }

  return { season, months }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
