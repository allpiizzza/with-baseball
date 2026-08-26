'use client'

import { useActionState, useMemo, useState } from 'react'

import { GameCard } from '@/components/GameCard'
import { formatGameDate } from '@/lib/format'
import type { Game, Team } from '@/lib/games/types'
import { createRoom, type FormState } from '@/lib/rooms/actions'

const INITIAL: FormState = { error: null }

/**
 * 후보 경기 고르기 + 방 만들기.
 *
 * 선택 상태는 이 컴포넌트가 들고 있다. 위쪽 필터를 바꾸면 URL만 갈아끼우는
 * soft navigation이라 이 컴포넌트는 마운트된 채로 남고, 골라둔 경기도 유지된다.
 * 그래서 "LG 경기 두 개 고르고, 필터를 두산으로 바꿔서 하나 더 고르기"가 된다.
 */
export function RoomBuilder({ games, teams }: { games: Game[]; teams: Team[] }) {
  const [state, formAction, isPending] = useActionState(createRoom, INITIAL)
  const [selected, setSelected] = useState<Map<string, Game>>(new Map())

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  const selectedGames = useMemo(
    () =>
      [...selected.values()].sort((a, b) =>
        a.game_date === b.game_date
          ? (a.start_time ?? '').localeCompare(b.start_time ?? '')
          : a.game_date < b.game_date
            ? -1
            : 1,
      ),
    [selected],
  )

  function toggle(game: Game) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(game.id)) next.delete(game.id)
      else next.set(game.id, game)
      return next
    })
  }

  return (
    <>
      {games.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
          조건에 맞는 경기가 없어요. 필터를 바꿔보세요.
        </p>
      ) : (
        <div className="space-y-2">
          {games.map((game) => {
            const checked = selected.has(game.id)
            return (
              <GameCard
                key={game.id}
                game={game}
                teamsById={teamsById}
                highlight={checked}
                action={
                  <button
                    type="button"
                    onClick={() => toggle(game)}
                    aria-pressed={checked}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      checked
                        ? 'border-accent bg-accent text-white'
                        : 'border-border text-muted hover:text-foreground'
                    }`}
                  >
                    {checked ? '담김' : '담기'}
                  </button>
                }
              />
            )
          })}
        </div>
      )}

      <form
        action={formAction}
        className="sticky bottom-4 mt-6 rounded-xl border border-border bg-surface p-4 shadow-lg"
      >
        {selectedGames.map((game) => (
          <input key={game.id} type="hidden" name="gameIds" value={game.id} />
        ))}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{selectedGames.length}경기 담김</span>
          {selectedGames.slice(0, 6).map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => toggle(game)}
              className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-muted hover:text-foreground"
              title="빼기"
            >
              {formatGameDate(game.game_date)} ✕
            </button>
          ))}
          {selectedGames.length > 6 && (
            <span className="text-xs text-muted">외 {selectedGames.length - 6}경기</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            name="title"
            required
            maxLength={60}
            placeholder="방 이름 (예: 4월 잠실 직관 가자)"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            disabled={isPending || selectedGames.length === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isPending ? '만드는 중…' : '방 만들기'}
          </button>
        </div>

        {state.error && <p className="mt-2 text-sm text-red-500">{state.error}</p>}
      </form>
    </>
  )
}
