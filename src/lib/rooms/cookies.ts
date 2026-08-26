import 'server-only'

import { cookies } from 'next/headers'

/**
 * 로그인이 없으므로 "나"를 식별하는 건 쿠키 두 개뿐이다.
 *
 * - 참가자 토큰: 이 방에서 내가 누구인지. 새로고침해도 내 응답이 유지되는 이유.
 * - 방장 토큰: 후보 경기를 추가/삭제할 수 있는지.
 *
 * 둘 다 httpOnly라 브라우저 JS가 읽을 수 없고, 방마다 따로 발급된다.
 * 계정을 도입하면 이 자리를 세션이 대신하고 participants.user_id로 병합한다.
 */
const MAX_AGE = 60 * 60 * 24 * 90 // 90일 — rooms.expires_at 과 맞춤

function participantCookie(slug: string) {
  return `wb_p_${slug}`
}

function ownerCookie(slug: string) {
  return `wb_owner_${slug}`
}

const baseOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE,
  secure: process.env.NODE_ENV === 'production',
}

export async function readParticipantToken(slug: string): Promise<string | null> {
  const store = await cookies()
  return store.get(participantCookie(slug))?.value ?? null
}

export async function writeParticipantToken(slug: string, token: string): Promise<void> {
  const store = await cookies()
  store.set(participantCookie(slug), token, baseOptions)
}

export async function readOwnerToken(slug: string): Promise<string | null> {
  const store = await cookies()
  return store.get(ownerCookie(slug))?.value ?? null
}

export async function writeOwnerToken(slug: string, token: string): Promise<void> {
  const store = await cookies()
  store.set(ownerCookie(slug), token, baseOptions)
}
