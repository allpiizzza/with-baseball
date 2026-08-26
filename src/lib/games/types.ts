import { z } from 'zod'

export interface Team {
  id: string
  name: string
  short_name: string
  color: string
  home_stadium: string | null
  sort_order: number
}

export type GameStatus = 'scheduled' | 'postponed' | 'canceled' | 'finished'

export interface Game {
  id: string
  season: number
  game_date: string // 'YYYY-MM-DD'
  start_time: string | null // 'HH:MM:SS'
  home_team_id: string
  away_team_id: string
  stadium: string | null
  status: GameStatus
  external_key: string
}

/**
 * 경기 한 건의 external_key.
 *
 * `{경기일}-{원정팀}-{홈팀}-{더블헤더 순번}` — 수기 등록(supabase/seed/games.example.sql)과
 * 크롤러(scripts/import-kbo.ts)가 이 규칙을 공유하기 때문에, 둘 중 무엇으로 넣어도
 * 같은 경기는 같은 행으로 수렴한다.
 */
export function buildExternalKey(input: {
  gameDate: string
  awayTeamId: string
  homeTeamId: string
  doubleHeader?: number
}): string {
  const seq = input.doubleHeader ?? 0
  return `${input.gameDate}-${input.awayTeamId}-${input.homeTeamId}-${seq}`
}

/** 크롤러가 upsertGames()에 넘기는 입력. */
export const gameInputSchema = z.object({
  season: z.number().int().min(1982).max(2100),
  gameDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'gameDate 는 YYYY-MM-DD 형식이어야 합니다'),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'startTime 은 HH:MM 형식이어야 합니다')
    .nullable()
    .default(null),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  stadium: z.string().nullable().default(null),
  status: z
    .enum(['scheduled', 'postponed', 'canceled', 'finished'])
    .default('scheduled'),
  doubleHeader: z.number().int().min(0).default(0),
})

export type GameInput = z.input<typeof gameInputSchema>
export type ParsedGameInput = z.output<typeof gameInputSchema>
