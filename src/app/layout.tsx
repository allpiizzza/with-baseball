import type { Metadata } from 'next'
import Link from 'next/link'

import './globals.css'

export const metadata: Metadata = {
  title: 'with-baseball — 같이 야구 보러 갈 날 정하기',
  description: 'KBO 일정을 팀별로 보고, 친구들과 O/X로 되는 날을 맞춰보세요.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              ⚾ with-baseball
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link href="/games" className="hover:text-foreground">
                경기 일정
              </Link>
              <Link href="/rooms/new" className="hover:text-foreground">
                방 만들기
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">
          경기 일정은 직접 등록하거나 KBO 공식 일정에서 가져옵니다.
        </footer>
      </body>
    </html>
  )
}
