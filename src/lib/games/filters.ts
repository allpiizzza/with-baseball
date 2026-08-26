import type { Side } from '@/lib/games/query'
import type { FilterValues } from '@/components/GameFilters'
import { todayIso } from '@/lib/format'

type RawSearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function many(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * URL 쿼리스트링 -> 필터 값.
 * 시작일 기본값은 오늘 — 지난 경기가 목록을 채우지 않도록.
 */
export function readFilters(searchParams: RawSearchParams): FilterValues {
  const from = first(searchParams.from)
  const to = first(searchParams.to)
  const side = first(searchParams.side)

  // from 파라미터가 아예 없으면 첫 방문 → 오늘부터.
  // 있는데 비어 있으면 사용자가 지운 것 → 하한 없음(지난 경기도 보여준다).
  const fromDefault = searchParams.from === undefined ? todayIso() : ''

  return {
    teamIds: many(searchParams.team),
    from: ISO_DATE.test(from) ? from : fromDefault,
    to: ISO_DATE.test(to) ? to : '',
    side: side === 'home' || side === 'away' ? (side as Side) : 'all',
    stadium: first(searchParams.stadium),
  }
}
