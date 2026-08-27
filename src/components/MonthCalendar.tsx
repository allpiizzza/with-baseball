import type { ReactNode } from 'react'

import { buildMonthGrid, weekdayLabels, type YearMonth } from '@/lib/calendar'

/**
 * 월 단위 달력 그리드.
 *
 * 날짜별 내용은 `cells` 로 주입한다 ('YYYY-MM-DD' -> 렌더된 노드). 렌더 함수가 아니라
 * 이미 렌더된 노드를 받기 때문에, 서버 컴포넌트에서 채워 넣어도 클라이언트 경계를
 * 넘길 수 있다.
 */
export function MonthCalendar({
  yearMonth,
  cells,
  today,
}: {
  yearMonth: YearMonth
  cells: Record<string, ReactNode>
  today?: string
}) {
  const weeks = buildMonthGrid(yearMonth)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border">
        {weekdayLabels().map((label, index) => (
          <div
            key={label}
            className={`px-2 py-2 text-center text-xs font-medium ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-muted'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => (
          <div
            key={day.date}
            className={`min-h-24 border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0 ${
              day.inMonth ? '' : 'bg-surface-muted/50'
            }`}
          >
            <div
              className={`mb-1 text-xs ${
                !day.inMonth
                  ? 'text-border'
                  : day.date === today
                    ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent font-semibold text-white'
                    : day.weekday === 0
                      ? 'text-red-500'
                      : day.weekday === 6
                        ? 'text-blue-500'
                        : 'text-muted'
              }`}
            >
              {day.day}
            </div>
            {day.inMonth && <div className="space-y-1">{cells[day.date]}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
