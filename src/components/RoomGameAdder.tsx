'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

import { GameCard } from '@/components/GameCard'
import type { Game, Team } from '@/lib/games/types'
import { addGamesToRoom } from '@/lib/rooms/actions'

/** 이미 방에 담긴 경기는 "담김"으로 잠가두고, 나머지만 고를 수 있게 한다. */
export function RoomGameAdder({
  slug,
  games,
  teams,
  alreadyInRoom,
}: {
  slug: string
  games: Game[]
  teams: Team[]
  alreadyInRoom: string[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const existing = useMemo(() => new Set(alreadyInRoom), [alreadyInRoom])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit() {
    startTransition(async () => {
      const result = await addGamesToRoom(slug, [...selected])
      if (result.error) {
        setError(result.error)
        return
      }
      router.push(`/rooms/${slug}`)
    })
  }

  return (
    <>
      {games.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
          조건에 맞는 경기가 없어요.
        </p>
      ) : (
        <div className="space-y-2">
          {games.map((game) => {
            const inRoom = existing.has(game.id)
            const checked = selected.has(game.id)
            return (
              <GameCard
                key={game.id}
                game={game}
                teamsById={teamsById}
                highlight={checked}
                action={
                  inRoom ? (
                    <span className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm text-muted">
                      이미 담김
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggle(game.id)}
                      aria-pressed={checked}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        checked
                          ? 'border-accent bg-accent text-white'
                          : 'border-border text-muted hover:text-foreground'
                      }`}
                    >
                      {checked ? '담김' : '담기'}
                    </button>
                  )
                }
              />
            )
          })}
        </div>
      )}

      <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg">
        <span className="text-sm font-medium">{selected.size}경기 담김</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-sm text-red-500">{error}</span>}
          <button
            type="button"
            onClick={submit}
            disabled={isPending || selected.size === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isPending ? '담는 중…' : '방에 추가'}
          </button>
        </div>
      </div>
    </>
  )
}
