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
        className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-foreground disabled:opacity-40"
        title="후보에서 빼기"
      >
        빼기
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
