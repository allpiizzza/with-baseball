import 'server-only'

import { supabase } from '@/lib/supabase/server'
import { listGamesByIds } from '@/lib/games/query'
import type { Game } from '@/lib/games/types'
import { readOwnerToken, readParticipantToken } from '@/lib/rooms/cookies'
import type { Participant, Room, VoteRecord } from '@/lib/rooms/types'

export interface RoomDetail {
  room: Room
  games: Game[]
  participants: Participant[]
  votes: VoteRecord[]
  /** 이 브라우저가 이 방에서 이미 참여한 사람. 아직 닉네임을 안 넣었으면 null. */
  me: Participant | null
  isOwner: boolean
}

export async function getRoomBySlug(slug: string): Promise<Room | null> {
  const { data, error } = await supabase()
    .from('rooms')
    .select('id, slug, title, created_at')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(`방을 불러오지 못했습니다: ${error.message}`)
  return (data as Room | null) ?? null
}

export async function getRoomDetail(slug: string): Promise<RoomDetail | null> {
  const db = supabase()

  const { data: roomRow, error: roomError } = await db
    .from('rooms')
    .select('id, slug, title, created_at, owner_token')
    .eq('slug', slug)
    .maybeSingle()

  if (roomError) throw new Error(`방을 불러오지 못했습니다: ${roomError.message}`)
  if (!roomRow) return null

  const room = roomRow as Room & { owner_token: string }

  const [{ data: roomGames, error: roomGamesError }, { data: participantRows, error: participantsError }] =
    await Promise.all([
      db.from('room_games').select('game_id').eq('room_id', room.id),
      db
        .from('participants')
        .select('id, nickname, created_at, edit_token')
        .eq('room_id', room.id)
        .order('created_at'),
    ])

  if (roomGamesError) throw new Error(`후보 경기를 불러오지 못했습니다: ${roomGamesError.message}`)
  if (participantsError) throw new Error(`참가자를 불러오지 못했습니다: ${participantsError.message}`)

  const gameIds = ((roomGames ?? []) as { game_id: string }[]).map((r) => r.game_id)
  const participantsWithToken = (participantRows ?? []) as (Participant & { edit_token: string })[]
  const participantIds = participantsWithToken.map((p) => p.id)

  const [games, votes] = await Promise.all([
    listGamesByIds(gameIds),
    fetchVotes(participantIds),
  ])

  const [participantToken, ownerToken] = await Promise.all([
    readParticipantToken(slug),
    readOwnerToken(slug),
  ])

  const meWithToken = participantToken
    ? participantsWithToken.find((p) => p.edit_token === participantToken) ?? null
    : null

  // edit_token 은 서버 밖으로 내보내지 않는다.
  const participants: Participant[] = participantsWithToken.map(
    ({ id, nickname, created_at }) => ({ id, nickname, created_at }),
  )

  return {
    room: { id: room.id, slug: room.slug, title: room.title, created_at: room.created_at },
    games,
    participants,
    votes,
    me: meWithToken
      ? { id: meWithToken.id, nickname: meWithToken.nickname, created_at: meWithToken.created_at }
      : null,
    isOwner: ownerToken !== null && ownerToken === room.owner_token,
  }
}

async function fetchVotes(participantIds: string[]): Promise<VoteRecord[]> {
  if (participantIds.length === 0) return []

  const { data, error } = await supabase()
    .from('votes')
    .select('participant_id, game_id, value')
    .in('participant_id', participantIds)

  if (error) throw new Error(`투표를 불러오지 못했습니다: ${error.message}`)
  return (data ?? []) as VoteRecord[]
}
