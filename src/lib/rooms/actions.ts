'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'

import { supabase } from '@/lib/supabase/server'
import {
  readOwnerToken,
  readParticipantToken,
  writeOwnerToken,
  writeParticipantToken,
} from '@/lib/rooms/cookies'
import { VOTE_VALUES, type VoteValue } from '@/lib/rooms/types'

/** 소문자+숫자만 — URL과 쿠키 이름에 그대로 들어가므로. */
const newSlug = customAlphabet('abcdefghijkmnopqrstuvwxyz23456789', 10)

const UUID = z.uuid()

export interface FormState {
  error: string | null
}

// ---------------------------------------------------------------------------
// 방 만들기
// ---------------------------------------------------------------------------

const createRoomSchema = z.object({
  title: z.string().trim().min(1, '방 이름을 입력해 주세요').max(60, '방 이름이 너무 깁니다'),
  gameIds: z.array(UUID).min(1, '후보 경기를 하나 이상 골라 주세요'),
})

export async function createRoom(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = createRoomSchema.safeParse({
    title: formData.get('title'),
    gameIds: formData.getAll('gameIds').map(String),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { title, gameIds } = parsed.data
  const uniqueGameIds = [...new Set(gameIds)]
  const db = supabase()
  const slug = newSlug()

  const { data: room, error: roomError } = await db
    .from('rooms')
    .insert({ slug, title })
    .select('id, slug, owner_token')
    .single()

  if (roomError || !room) {
    return { error: `방을 만들지 못했습니다: ${roomError?.message ?? '알 수 없는 오류'}` }
  }

  const { error: linkError } = await db
    .from('room_games')
    .insert(uniqueGameIds.map((game_id) => ({ room_id: room.id, game_id })))

  if (linkError) {
    await db.from('rooms').delete().eq('id', room.id)
    return { error: `후보 경기를 담지 못했습니다: ${linkError.message}` }
  }

  await writeOwnerToken(room.slug, room.owner_token as string)
  redirect(`/rooms/${room.slug}`)
}

// ---------------------------------------------------------------------------
// 참여하기
// ---------------------------------------------------------------------------

const joinSchema = z.object({
  slug: z.string().min(1),
  nickname: z
    .string()
    .trim()
    .min(1, '닉네임을 입력해 주세요')
    .max(16, '닉네임은 16자까지 가능합니다'),
})

export async function joinRoom(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse({
    slug: formData.get('slug'),
    nickname: formData.get('nickname'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { slug, nickname } = parsed.data
  const db = supabase()

  const { data: room, error: roomError } = await db
    .from('rooms')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (roomError) return { error: `방을 불러오지 못했습니다: ${roomError.message}` }
  if (!room) return { error: '없는 방입니다' }

  const { data: participant, error } = await db
    .from('participants')
    .insert({ room_id: room.id, nickname })
    .select('edit_token')
    .single()

  if (error || !participant) {
    // unique (room_id, nickname)
    if (error?.code === '23505') {
      return { error: '이미 쓰고 있는 닉네임이에요. 다른 이름으로 해주세요.' }
    }
    return { error: `참여하지 못했습니다: ${error?.message ?? '알 수 없는 오류'}` }
  }

  await writeParticipantToken(slug, participant.edit_token as string)
  revalidatePath(`/rooms/${slug}`)
  return { error: null }
}

// ---------------------------------------------------------------------------
// 투표
// ---------------------------------------------------------------------------

/**
 * 내 응답을 저장한다.
 *
 * participantId 는 클라이언트에서 받지 않는다 — 쿠키의 edit_token 으로 서버가
 * 직접 찾는다. Server Action 은 UI를 거치지 않고 POST 로도 호출될 수 있어서,
 * 클라이언트가 보낸 신원을 믿으면 남의 표를 바꿀 수 있게 된다.
 */
export async function castVote(
  slug: string,
  gameId: string,
  value: VoteValue,
): Promise<FormState> {
  if (!UUID.safeParse(gameId).success) return { error: '잘못된 경기입니다' }
  if (!VOTE_VALUES.includes(value)) return { error: '잘못된 응답입니다' }

  const token = await readParticipantToken(slug)
  if (!token) return { error: '먼저 닉네임을 입력해 참여해 주세요' }

  const db = supabase()

  const { data: room, error: roomError } = await db
    .from('rooms')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (roomError) return { error: `방을 불러오지 못했습니다: ${roomError.message}` }
  if (!room) return { error: '없는 방입니다' }

  const { data: participant, error: participantError } = await db
    .from('participants')
    .select('id')
    .eq('room_id', room.id)
    .eq('edit_token', token)
    .maybeSingle()

  if (participantError) {
    return { error: `참가자를 확인하지 못했습니다: ${participantError.message}` }
  }
  if (!participant) return { error: '이 방의 참가자가 아닙니다' }

  // 이 방의 후보 경기인지 확인 — 방에 없는 경기에 표를 남기지 못하게.
  const { data: link, error: linkError } = await db
    .from('room_games')
    .select('game_id')
    .eq('room_id', room.id)
    .eq('game_id', gameId)
    .maybeSingle()

  if (linkError) return { error: `후보 경기를 확인하지 못했습니다: ${linkError.message}` }
  if (!link) return { error: '이 방의 후보 경기가 아닙니다' }

  const { error } = await db.from('votes').upsert(
    {
      participant_id: participant.id,
      game_id: gameId,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'participant_id,game_id' },
  )

  if (error) return { error: `저장하지 못했습니다: ${error.message}` }

  revalidatePath(`/rooms/${slug}`)
  return { error: null }
}

// ---------------------------------------------------------------------------
// 후보 경기 관리 (방장만)
// ---------------------------------------------------------------------------

async function requireOwnedRoom(slug: string): Promise<{ id: string } | null> {
  const token = await readOwnerToken(slug)
  if (!token) return null

  const { data, error } = await supabase()
    .from('rooms')
    .select('id, owner_token')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return data.owner_token === token ? { id: data.id as string } : null
}

export async function addGamesToRoom(slug: string, gameIds: string[]): Promise<FormState> {
  const ids = [...new Set(gameIds)].filter((id) => UUID.safeParse(id).success)
  if (ids.length === 0) return { error: '추가할 경기를 골라 주세요' }

  const room = await requireOwnedRoom(slug)
  if (!room) return { error: '방장만 후보 경기를 바꿀 수 있어요' }

  const { error } = await supabase()
    .from('room_games')
    .upsert(
      ids.map((game_id) => ({ room_id: room.id, game_id })),
      { onConflict: 'room_id,game_id' },
    )

  if (error) return { error: `경기를 담지 못했습니다: ${error.message}` }

  revalidatePath(`/rooms/${slug}`)
  return { error: null }
}

export async function removeGameFromRoom(slug: string, gameId: string): Promise<FormState> {
  if (!UUID.safeParse(gameId).success) return { error: '잘못된 경기입니다' }

  const room = await requireOwnedRoom(slug)
  if (!room) return { error: '방장만 후보 경기를 바꿀 수 있어요' }

  const { error } = await supabase()
    .from('room_games')
    .delete()
    .eq('room_id', room.id)
    .eq('game_id', gameId)

  if (error) return { error: `경기를 빼지 못했습니다: ${error.message}` }

  revalidatePath(`/rooms/${slug}`)
  return { error: null }
}
