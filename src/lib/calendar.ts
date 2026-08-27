/**
 * 달력 그리드 계산. 순수 함수 — 렌더링도 DB도 모른다.
 *
 * 날짜 계산은 전부 UTC 기준으로 한다. 로컬 타임존으로 Date 를 만들면 서버(UTC)와
 * 브라우저(KST)에서 "오늘"이 다르게 나와 하이드레이션이 어긋난다.
 */

export interface CalendarDay {
  /** 'YYYY-MM-DD' */
  date: string
  day: number
  /** 이번 달 날짜인가 (앞뒤로 붙는 이웃 달 칸이면 false) */
  inMonth: boolean
  /** 0=일 … 6=토 */
  weekday: number
}

export interface YearMonth {
  year: number
  /** 1~12 */
  month: number
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function weekdayLabels(): string[] {
  return WEEKDAY_LABELS
}

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** 'YYYY-MM' -> {year, month}. 형식이 틀리면 null. */
export function parseYearMonth(value: string | undefined | null): YearMonth | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return { year, month }
}

/** {year, month} -> 'YYYY-MM' */
export function formatYearMonth({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** 'YYYY-MM-DD' -> {year, month} */
export function yearMonthOf(isoDate: string): YearMonth {
  const [year, month] = isoDate.split('-').map(Number)
  return { year, month }
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const zeroBased = year * 12 + (month - 1) + delta
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 }
}

export function monthLabel({ year, month }: YearMonth): string {
  return `${year}년 ${month}월`
}

/** 그 달의 첫날과 마지막날 (필터 범위로 그대로 쓴다). */
export function monthRange({ year, month }: YearMonth): { from: string; to: string } {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { from: iso(year, month, 1), to: iso(year, month, lastDay) }
}

/**
 * 일요일로 시작하는 주 단위 그리드. 앞뒤로 이웃 달 날짜를 채워 항상 7의 배수가 된다.
 */
export function buildMonthGrid({ year, month }: YearMonth): CalendarDay[][] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const cells: CalendarDay[] = []

  // 앞쪽 이웃 달
  const prev = shiftMonth({ year, month }, -1)
  const daysInPrev = new Date(Date.UTC(prev.year, prev.month, 0)).getUTCDate()
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i
    cells.push({
      date: iso(prev.year, prev.month, day),
      day,
      inMonth: false,
      weekday: cells.length % 7,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: iso(year, month, day), day, inMonth: true, weekday: cells.length % 7 })
  }

  // 뒤쪽 이웃 달 — 마지막 주를 7칸으로 채운다
  const next = shiftMonth({ year, month }, 1)
  let day = 1
  while (cells.length % 7 !== 0) {
    cells.push({
      date: iso(next.year, next.month, day),
      day,
      inMonth: false,
      weekday: cells.length % 7,
    })
    day += 1
  }

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
