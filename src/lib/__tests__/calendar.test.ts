import { describe, expect, it } from 'vitest'

import {
  buildMonthGrid,
  formatYearMonth,
  monthLabel,
  monthRange,
  parseYearMonth,
  shiftMonth,
  yearMonthOf,
} from '@/lib/calendar'

describe('buildMonthGrid', () => {
  it('일요일로 시작하는 7칸짜리 주로 나눈다', () => {
    const weeks = buildMonthGrid({ year: 2026, month: 9 })

    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks[0][0].weekday).toBe(0)
  })

  it('이번 달 날짜를 하나도 빠짐없이 담는다', () => {
    const weeks = buildMonthGrid({ year: 2026, month: 9 })
    const inMonth = weeks.flat().filter((d) => d.inMonth)

    expect(inMonth).toHaveLength(30)
    expect(inMonth[0].date).toBe('2026-09-01')
    expect(inMonth[29].date).toBe('2026-09-30')
  })

  it('앞뒤 빈칸은 이웃 달 날짜로 채운다', () => {
    // 2026-09-01 은 화요일 -> 앞에 일·월 두 칸
    const weeks = buildMonthGrid({ year: 2026, month: 9 })

    expect(weeks[0][0]).toMatchObject({ date: '2026-08-30', inMonth: false })
    expect(weeks[0][1]).toMatchObject({ date: '2026-08-31', inMonth: false })
    expect(weeks[0][2]).toMatchObject({ date: '2026-09-01', inMonth: true })
  })

  it('윤년 2월을 제대로 센다', () => {
    const leap = buildMonthGrid({ year: 2028, month: 2 }).flat().filter((d) => d.inMonth)
    const common = buildMonthGrid({ year: 2026, month: 2 }).flat().filter((d) => d.inMonth)

    expect(leap).toHaveLength(29)
    expect(common).toHaveLength(28)
  })

  it('1일이 일요일인 달은 앞 빈칸이 없다', () => {
    // 2026-11-01 은 일요일
    const weeks = buildMonthGrid({ year: 2026, month: 11 })

    expect(weeks[0][0]).toMatchObject({ date: '2026-11-01', inMonth: true })
  })
})

describe('shiftMonth', () => {
  it('연말·연초를 넘어간다', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
  })

  it('여러 달을 한 번에 옮긴다', () => {
    expect(shiftMonth({ year: 2026, month: 3 }, 12)).toEqual({ year: 2027, month: 3 })
    expect(shiftMonth({ year: 2026, month: 3 }, -14)).toEqual({ year: 2025, month: 1 })
  })
})

describe('monthRange', () => {
  it('그 달의 첫날과 마지막날을 준다', () => {
    expect(monthRange({ year: 2026, month: 9 })).toEqual({ from: '2026-09-01', to: '2026-09-30' })
    expect(monthRange({ year: 2028, month: 2 })).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })
})

describe('parseYearMonth / formatYearMonth / yearMonthOf', () => {
  it('YYYY-MM 을 오간다', () => {
    expect(parseYearMonth('2026-09')).toEqual({ year: 2026, month: 9 })
    expect(formatYearMonth({ year: 2026, month: 9 })).toBe('2026-09')
    expect(yearMonthOf('2026-09-14')).toEqual({ year: 2026, month: 9 })
  })

  it('형식이 어긋나면 null', () => {
    for (const bad of ['2026-13', '2026/09', '26-09', '', undefined, null]) {
      expect(parseYearMonth(bad)).toBeNull()
    }
  })
})

describe('monthLabel', () => {
  it('한국어로 읽는다', () => {
    expect(monthLabel({ year: 2026, month: 9 })).toBe('2026년 9월')
  })
})
