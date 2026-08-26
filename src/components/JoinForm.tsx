'use client'

import { useActionState } from 'react'

import { joinRoom, type FormState } from '@/lib/rooms/actions'

const INITIAL: FormState = { error: null }

export function JoinForm({ slug }: { slug: string }) {
  const [state, formAction, isPending] = useActionState(joinRoom, INITIAL)

  return (
    <form action={formAction} className="rounded-xl border border-border bg-surface p-5">
      <input type="hidden" name="slug" value={slug} />
      <h2 className="font-medium">누구세요?</h2>
      <p className="mt-1 text-sm text-muted">
        닉네임만 넣으면 바로 참여할 수 있어요. 가입은 없습니다.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          name="nickname"
          required
          maxLength={16}
          autoComplete="off"
          placeholder="닉네임"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {isPending ? '참여 중…' : '참여하기'}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-red-500">{state.error}</p>}
    </form>
  )
}
