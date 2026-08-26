'use client'

import { useOptimistic, useState, useTransition } from 'react'

import { castVote } from '@/lib/rooms/actions'
import { VOTE_LABEL, type VoteValue } from '@/lib/rooms/types'

const OPTIONS: VoteValue[] = ['yes', 'maybe', 'no']

const ACTIVE_STYLE: Record<VoteValue, string> = {
  yes: 'border-accent bg-accent text-white',
  maybe: 'border-amber-500 bg-amber-500 text-white',
  no: 'border-neutral-400 bg-neutral-400 text-white',
}

export function VoteToggle({
  slug,
  gameId,
  current,
}: {
  slug: string
  gameId: string
  current: VoteValue | null
}) {
  // 서버 응답이 돌아오면 current 로 자동 복귀한다. 낙관적 업데이트가 어긋나도
  // 화면이 진실에서 벗어난 채로 남지 않는다.
  const [shown, setShown] = useOptimistic(current, (_prev, next: VoteValue) => next)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function vote(value: VoteValue) {
    startTransition(async () => {
      setShown(value)
      const result = await castVote(slug, gameId, value)
      setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {OPTIONS.map((option) => {
          const active = shown === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => vote(option)}
              aria-pressed={active}
              aria-label={`${VOTE_LABEL[option]} (${LABEL_HINT[option]})`}
              className={`h-9 w-9 rounded-lg border text-sm font-semibold transition ${
                active ? ACTIVE_STYLE[option] : 'border-border text-muted hover:text-foreground'
              }`}
            >
              {VOTE_LABEL[option]}
            </button>
          )
        })}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

const LABEL_HINT: Record<VoteValue, string> = {
  yes: '갈 수 있어요',
  maybe: '아마도',
  no: '안 돼요',
}
