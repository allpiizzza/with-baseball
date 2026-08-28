import Link from 'next/link'
import type { ReactNode } from 'react'

import { buildMonthGrid, weekdayLabels, type YearMonth } from '@/lib/calendar'

export interface CalendarCell {
  /** 좁은 화면용 요약 — 셀 폭이 50px 남짓이라 한두 글자만 들어간다. */
  summary: ReactNode
  /** 큰 화면용 상세. 셀 안에 그대로 펼친다. */
  detail: ReactNode
}

/**
 * 월 단위 달력 그리드.
 *
 * 모바일에서 7열 × 하루 5경기를 셀 안에 다 그리면 글자가 세 줄로 깨져 못 읽는다.
 * 그래서 좁은 화면에서는 셀에 요약만 두고, 날짜를 누르면 아래에 그 날 상세가
 * 펼쳐지도록 했다(캘린더 앱들이 쓰는 방식). 큰 화면에서는 셀 안에 바로 펼친다.
 *
 * 날짜별 내용은 렌더 함수가 아니라 이미 렌더된 노드로 받는다 — 서버 컴포넌트에서
 * 채운 내용을 그대로 넘길 수 있다.
 */
export function MonthCalendar({
  yearMonth,
  cells,
  today,
  selectedDate,
  hrefForDate,
}: {
  yearMonth: YearMonth
  cells: Record<string, CalendarCell>
  today?: string
  selectedDate?: string | null
  /** 날짜를 눌렀을 때 갈 주소. 없으면 셀이 링크가 아니다. */
  hrefForDate?: (date: string) => string
}) {
  const weeks = buildMonthGrid(yearMonth)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border">
        {weekdayLabels().map((label, index) => (
          <div
            key={label}
            className={`px-1 py-2 text-center text-xs font-medium ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-muted'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const cell = day.inMonth ? cells[day.date] : undefined
          const selected = day.date === selectedDate
          const href = cell && hrefForDate ? hrefForDate(day.date) : null

          const inner = (
            <>
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  !day.inMonth
                    ? 'text-border'
                    : selected
                      ? 'bg-foreground font-semibold text-background'
                      : day.date === today
                        ? 'bg-accent font-semibold text-white'
                        : day.weekday === 0
                          ? 'text-red-500'
                          : day.weekday === 6
                            ? 'text-blue-500'
                            : 'text-muted'
                }`}
              >
                {day.day}
              </div>
              {cell && (
                <>
                  <div className="sm:hidden">{cell.summary}</div>
                  <div className="hidden space-y-1 sm:block">{cell.detail}</div>
                </>
              )}
            </>
          )

          const className = `min-h-16 border-b border-r border-border p-1 text-left sm:min-h-24 sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${
            day.inMonth ? '' : 'bg-surface-muted/50'
          } ${selected ? 'bg-accent-soft' : ''}`

          return href ? (
            <Link
              key={day.date}
              href={href}
              scroll={false}
              aria-current={selected ? 'date' : undefined}
              className={`${className} block active:bg-surface-muted`}
            >
              {inner}
            </Link>
          ) : (
            <div key={day.date} className={className}>
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 좁은 화면 셀에 들어가는 "n경기" 알약. */
export function CountPill({ count }: { count: number }) {
  return (
    <span className="inline-block rounded bg-surface-muted px-1 py-0.5 text-[10px] font-medium leading-none text-muted">
      {count}경기
    </span>
  )
}
