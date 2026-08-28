import Link from 'next/link'

import { formatYearMonth, monthLabel, shiftMonth, type YearMonth } from '@/lib/calendar'
import { withParams, type RawSearchParams } from '@/lib/url'

export function MonthNav({
  pathname,
  searchParams,
  yearMonth,
}: {
  pathname: string
  searchParams: RawSearchParams
  yearMonth: YearMonth
}) {
  const link = (delta: number) =>
    withParams(pathname, searchParams, {
      view: 'calendar',
      month: formatYearMonth(shiftMonth(yearMonth, delta)),
      // 다른 달로 넘어가면 골라둔 날짜는 의미가 없다.
      date: null,
    })

  return (
    <div className="flex items-center gap-1">
      <Link
        href={link(-1)}
        scroll={false}
        aria-label="이전 달"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-lg text-muted hover:text-foreground"
      >
        ‹
      </Link>
      <span className="min-w-28 text-center text-sm font-medium">{monthLabel(yearMonth)}</span>
      <Link
        href={link(1)}
        scroll={false}
        aria-label="다음 달"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-lg text-muted hover:text-foreground"
      >
        ›
      </Link>
    </div>
  )
}
