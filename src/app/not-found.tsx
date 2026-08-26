import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">없는 페이지예요</h1>
      <p className="text-sm text-muted">
        방이 지워졌거나 링크가 잘못됐을 수 있어요.
      </p>
      <div className="flex gap-2">
        <Link
          href="/games"
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          경기 일정 보기
        </Link>
        <Link
          href="/rooms/new"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          방 만들기
        </Link>
      </div>
    </div>
  )
}
