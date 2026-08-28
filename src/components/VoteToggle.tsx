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

const LABEL_HINT: Record<VoteValue, string> = {
  yes: '갈 수 있어요',
  maybe: '아마도',
  no: '안 돼요',
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
    <div className="w-full sm:w-auto">
      {/*
        모바일에서 가장 많이 눌리는 버튼이다. 세 칸을 가로로 꽉 채워 엄지로 정확히
        누를 수 있게 하고(최소 44px), 큰 화면에서는 정사각형으로 줄인다.
      */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-1.5">
        {OPTIONS.map((option) => {
          const active = shown === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => vote(option)}
              aria-pressed={active}
              aria-label={`${VOTE_LABEL[option]} (${LABEL_HINT[option]})`}
              className={`h-12 rounded-xl border text-base font-semibold transition select-none sm:h-11 sm:w-11 sm:rounded-lg sm:text-sm ${
                active ? ACTIVE_STYLE[option] : 'border-border text-muted active:bg-surface-muted'
              }`}
            >
              {VOTE_LABEL[option]}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
