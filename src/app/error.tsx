'use client'

/**
 * 첫 실행에서 가장 흔한 실패는 Supabase 미설정이다. 스택 트레이스 대신
 * 무엇을 해야 하는지 보여준다.
 */
export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">데이터를 불러오지 못했습니다</h1>
      {/*
        프로덕션에서 서버 컴포넌트의 에러 메시지는 React 쪽에서 가려진 채로 넘어온다.
        그 문자열을 그대로 보여줘봐야 읽는 사람에게 도움이 안 되므로, 서버 로그와
        맞춰볼 수 있는 digest 만 남긴다. 개발 중에는 Next 오버레이가 진짜 원인을 보여준다.
      */}
      {error.digest && (
        <p className="font-mono text-xs text-muted">에러 코드 {error.digest}</p>
      )}

      <div className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium">처음 실행하는 거라면</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
          <li>
            <code className="text-foreground">.env.example</code> 을{' '}
            <code className="text-foreground">.env.local</code> 로 복사해 Supabase URL과
            service_role 키를 채우세요.
          </li>
          <li>
            Supabase SQL Editor에서{' '}
            <code className="text-foreground">supabase/migrations/0001_init.sql</code> 과{' '}
            <code className="text-foreground">supabase/seed/teams.sql</code> 을 실행하세요.
          </li>
          <li>
            경기 일정은{' '}
            <code className="text-foreground">supabase/seed/games.example.sql</code> 로 넣습니다.
          </li>
        </ol>
        <p className="mt-2 text-muted">자세한 절차는 README에 있습니다.</p>
      </div>

      <button
        type="button"
        onClick={() => retry()}
        className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted"
      >
        다시 시도
      </button>
    </div>
  )
}
