'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { Team } from '@/lib/games/types'
import type { Side } from '@/lib/games/query'

export interface FilterValues {
  teamIds: string[]
  from: string
  to: string
  side: Side
  stadium: string
}

/**
 * 팀/기간/홈원정/구장 필터.
 *
 * 상태는 컴포넌트가 아니라 URL 쿼리스트링이 들고 있다. 필터를 건 화면을 그대로
 * 링크로 던질 수 있고, 뒤로가기도 자연스럽게 동작한다.
 */
export function GameFilters({
  teams,
  stadiums,
  values,
}: {
  teams: Team[]
  stadiums: string[]
  values: FilterValues
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function apply(next: Partial<FilterValues>) {
    const merged = { ...values, ...next }
    const params = new URLSearchParams()
    for (const id of merged.teamIds) params.append('team', id)
    // from 은 비어 있어도 항상 넣는다. 파라미터가 없으면 "첫 방문"이라 오늘로 채워지고,
    // 있는데 비어 있으면 "사용자가 지웠다"는 뜻이라 지난 경기까지 보여준다.
    params.set('from', merged.from)
    if (merged.to) params.set('to', merged.to)
    if (merged.side !== 'all') params.set('side', merged.side)
    if (merged.stadium) params.set('stadium', merged.stadium)

    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  function toggleTeam(id: string) {
    const selected = values.teamIds.includes(id)
      ? values.teamIds.filter((t) => t !== id)
      : [...values.teamIds, id]
    apply({ teamIds: selected })
  }

  return (
    <section
      className={`rounded-xl border border-border bg-surface p-4 ${isPending ? 'opacity-70' : ''}`}
      aria-busy={isPending}
    >
      <div className="flex flex-wrap gap-2">
        {teams.map((team) => {
          const active = values.teamIds.includes(team.id)
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => toggleTeam(team.id)}
              aria-pressed={active}
              className="rounded-full border px-3 py-1.5 text-sm font-medium transition"
              style={
                active
                  ? { backgroundColor: team.color, borderColor: team.color, color: '#fff' }
                  : { borderColor: 'var(--border)', color: 'var(--muted)' }
              }
            >
              {team.short_name}
            </button>
          )
        })}
        {values.teamIds.length > 0 && (
          <button
            type="button"
            onClick={() => apply({ teamIds: [] })}
            className="rounded-full px-3 py-1.5 text-sm text-muted underline underline-offset-4"
          >
            전체 해제
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          시작일
          <input
            type="date"
            value={values.from}
            onChange={(e) => apply({ from: e.target.value })}
            className="rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          종료일
          <input
            type="date"
            value={values.to}
            onChange={(e) => apply({ to: e.target.value })}
            className="rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          홈/원정
          <select
            value={values.side}
            onChange={(e) => apply({ side: e.target.value as Side })}
            className="rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm text-foreground"
          >
            <option value="all">전체</option>
            <option value="home">홈경기만</option>
            <option value="away">원정경기만</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          구장
          <select
            value={values.stadium}
            onChange={(e) => apply({ stadium: e.target.value })}
            className="rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm text-foreground"
          >
            <option value="">전체</option>
            {stadiums.map((stadium) => (
              <option key={stadium} value={stadium}>
                {stadium}
              </option>
            ))}
          </select>
        </label>
      </div>

      {values.side !== 'all' && values.teamIds.length === 0 && (
        <p className="mt-3 text-xs text-muted">
          홈/원정 필터는 팀을 하나 이상 골라야 적용됩니다.
        </p>
      )}
    </section>
  )
}
