import Link from 'next/link'

import { withParams, type RawSearchParams } from '@/lib/url'

export type ViewMode = 'list' | 'calendar'

export function readView(searchParams: RawSearchParams): ViewMode {
  return searchParams.view === 'calendar' ? 'calendar' : 'list'
}

/** 목록 ↔ 달력. 상태를 URL에 두기 때문에 필터처럼 링크로 그대로 공유된다. */
export function ViewToggle({
  pathname,
  searchParams,
  current,
  labels = { list: '목록', calendar: '달력' },
}: {
  pathname: string
  searchParams: RawSearchParams
  current: ViewMode
  labels?: Record<ViewMode, string>
}) {
  const options: ViewMode[] = ['list', 'calendar']

  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      {options.map((mode) => {
        const active = mode === current
        return (
          <Link
            key={mode}
            href={withParams(pathname, searchParams, {
              view: mode === 'list' ? null : mode,
              // 달력은 월 단위로 움직이므로 이전 뷰의 month 를 들고 가지 않는다.
              month: null,
            })}
            scroll={false}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active ? 'bg-accent text-white' : 'text-muted hover:text-foreground'
            }`}
          >
            {labels[mode]}
          </Link>
        )
      })}
    </div>
  )
}
