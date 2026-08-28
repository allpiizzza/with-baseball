import Link from 'next/link'

import { RecentRooms } from '@/components/RecentRooms'

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          같이 야구 보러 갈 날,
          <br />
          한 번에 정하기
        </h1>
        <p className="max-w-prose text-muted">
          KBO 일정을 팀별로 골라 후보로 담고, 링크를 친구들에게 보내세요. 각자 O·X만 찍으면
          다 되는 날이 맨 위로 올라옵니다. 가입은 없습니다.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/rooms/new"
            className="flex h-12 items-center justify-center rounded-lg bg-accent px-5 font-medium text-white"
          >
            일정 조율 방 만들기
          </Link>
          <Link
            href="/games"
            className="flex h-12 items-center justify-center rounded-lg border border-border px-5 font-medium hover:bg-surface-muted"
          >
            경기 일정 보기
          </Link>
        </div>
      </section>

      <RecentRooms />

      <section className="grid gap-3 sm:grid-cols-3">
        <Step n={1} title="경기 담기">
          팀·기간·구장으로 걸러서 갈 만한 경기를 후보로 담습니다.
        </Step>
        <Step n={2} title="링크 보내기">
          방을 만들면 나오는 링크를 단톡방에 던지세요.
        </Step>
        <Step n={3} title="O·X 찍기">
          친구들이 닉네임만 넣고 O·X를 찍으면 되는 날이 정렬돼 보입니다.
        </Step>
      </section>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs font-medium text-accent">STEP {n}</div>
      <div className="mt-1 font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  )
}
