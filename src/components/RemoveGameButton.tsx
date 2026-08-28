'use client'

import { useState, useTransition } from 'react'

import { removeGameFromRoom } from '@/lib/rooms/actions'

export function RemoveGameButton({ slug, gameId }: { slug: string; gameId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await removeGameFromRoom(slug, gameId)
            setError(result.error)
          })
        }
        className="min-h-11 rounded-lg px-3 text-xs text-muted underline underline-offset-4 hover:text-foreground disabled:opacity-40"
        title="후보에서 빼기"
      >
        빼기
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
