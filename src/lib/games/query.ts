import 'server-only'

import { supabase } from '@/lib/supabase/server'
import type { Game, Team } from '@/lib/games/types'

export type Side = 'all' | 'home' | 'away'

export interface GameFilters {
  teamIds: string[]
  from: string | null
  to: string | null
  side: Side
  stadium: string | null
}

/** 팀 코드는 시드된 두 글자 대문자 코드만 허용한다 (아래 .or() 문자열에 그대로 들어가므로). */
const TEAM_ID_PATTERN = /^[A-Z]{2}$/

export function sanitizeTeamIds(ids: string[]): string[] {
  return [...new Set(ids)].filter((id) => TEAM_ID_PATTERN.test(id))
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase()
    .from('teams')
    .select('id, name, short_name, color, home_stadium, sort_order')
    .order('sort_order')

  if (error) throw new Error(`팀 목록을 불러오지 못했습니다: ${error.message}`)
  return (data ?? []) as Team[]
}

export async function listGames(filters: GameFilters): Promise<Game[]> {
  const teamIds = sanitizeTeamIds(filters.teamIds)

  let query = supabase()
    .from('games')
    .select(
      'id, season, game_date, start_time, home_team_id, away_team_id, stadium, status, external_key',
    )
    .order('game_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })
    .limit(500)

  if (filters.from) query = query.gte('game_date', filters.from)
  if (filters.to) query = query.lte('game_date', filters.to)
  if (filters.stadium) query = query.eq('stadium', filters.stadium)

  if (teamIds.length > 0) {
    const list = teamIds.join(',')
    if (filters.side === 'home') {
      query = query.in('home_team_id', teamIds)
    } else if (filters.side === 'away') {
      query = query.in('away_team_id', teamIds)
    } else {
      query = query.or(`home_team_id.in.(${list}),away_team_id.in.(${list})`)
    }
  }

  const { data, error } = await query
  if (error) throw new Error(`경기 일정을 불러오지 못했습니다: ${error.message}`)
  return (data ?? []) as Game[]
}

export async function listGamesByIds(ids: string[]): Promise<Game[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabase()
    .from('games')
    .select(
      'id, season, game_date, start_time, home_team_id, away_team_id, stadium, status, external_key',
    )
    .in('id', ids)
    .order('game_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })

  if (error) throw new Error(`경기를 불러오지 못했습니다: ${error.message}`)
  return (data ?? []) as Game[]
}

/** 필터 UI의 구장 드롭다운 채우기용. */
export async function listStadiums(): Promise<string[]> {
  const { data, error } = await supabase().from('games').select('stadium')
  if (error) throw new Error(`구장 목록을 불러오지 못했습니다: ${error.message}`)

  const stadiums = new Set<string>()
  for (const row of (data ?? []) as { stadium: string | null }[]) {
    if (row.stadium) stadiums.add(row.stadium)
  }
  return [...stadiums].sort((a, b) => a.localeCompare(b, 'ko'))
}
