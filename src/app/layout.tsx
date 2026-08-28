import type { Metadata, Viewport } from 'next'
import Link from 'next/link'

import './globals.css'

export const metadata: Metadata = {
  title: 'with-baseball — 같이 야구 보러 갈 날 정하기',
  description: 'KBO 일정을 팀별로 보고, 친구들과 O/X로 되는 날을 맞춰보세요.',
  // 카톡·메신저로 링크를 던지는 게 기본 사용법이라 미리보기가 중요하다.
  openGraph: {
    title: 'with-baseball — 같이 야구 보러 갈 날 정하기',
    description: '닉네임만 넣고 O·X를 찍으면 다 되는 날이 맨 위로 올라옵니다.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // maximumScale 을 막지 않는다 — 확대는 접근성 기능이다.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f8' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0f12' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* 헤더는 스크롤해도 붙어 있다 — 긴 일정 목록에서 이동이 잦다. */}
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-1 px-2 sm:px-4">
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-lg px-2 font-semibold tracking-tight"
            >
              ⚾ <span className="ml-1">with-baseball</span>
            </Link>
            <nav className="flex items-center text-sm text-muted">
              <Link
                href="/games"
                className="flex min-h-11 items-center rounded-lg px-3 hover:text-foreground"
              >
                경기 일정
              </Link>
              <Link
                href="/rooms/new"
                className="flex min-h-11 items-center rounded-lg px-3 hover:text-foreground"
              >
                방 만들기
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">
          경기 일정은 직접 등록하거나 KBO 공식 일정에서 가져옵니다.
        </footer>
      </body>
    </html>
  )
}
