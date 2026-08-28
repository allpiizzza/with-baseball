'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { rememberRoom } from '@/lib/recent-rooms'

/** origin 은 서버 렌더에선 알 수 없다. 하이드레이션 후 채운다. */
const subscribeToNothing = () => () => {}
const readOrigin = () => window.location.origin
const readOriginOnServer = () => ''

/** 방 링크 복사 + 이 브라우저의 "최근 본 방" 목록에 기록. */
export function ShareLink({ slug, title }: { slug: string; title: string }) {
  const origin = useSyncExternalStore(subscribeToNothing, readOrigin, readOriginOnServer)
  const url = `${origin}/rooms/${slug}`
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    rememberRoom({ slug, title })
  }, [slug, title])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 클립보드 권한이 없으면 input 을 직접 고르게 둔다.
    }
  }

  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 text-base text-muted sm:text-sm"
      />
      <button
        type="button"
        onClick={copy}
        className="h-11 shrink-0 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-muted active:bg-surface-muted"
      >
        {copied ? '복사됨' : '링크 복사'}
      </button>
    </div>
  )
}
