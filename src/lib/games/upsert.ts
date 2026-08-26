import 'server-only'

import { supabase } from '@/lib/supabase/server'
import { buildExternalKey, gameInputSchema, type GameInput } from '@/lib/games/types'

export interface UpsertResult {
  received: number
  written: number
  errors: string[]
}

/**
 * 크롤러(scripts/import-kbo.ts)가 쓰는 진입점.
 *
 * external_key 기준 upsert라 같은 데이터를 몇 번을 넣어도 행이 늘지 않는다.
 * 수기 등록(supabase/seed/games.example.sql)이 같은 키 규칙을 쓰므로, 손으로 넣은
 * 경기와 크롤링한 경기가 섞여도 서로를 갱신할 뿐 중복되지 않는다.
 */
export async function upsertGames(rows: GameInput[]): Promise<UpsertResult> {
  const errors: string[] = []
  const payload: Record<string, unknown>[] = []

  for (const [index, row] of rows.entries()) {
    const parsed = gameInputSchema.safeParse(row)
    if (!parsed.success) {
      errors.push(`#${index}: ${parsed.error.issues.map((i) => i.message).join(', ')}`)
      continue
    }

    const game = parsed.data
    payload.push({
      season: game.season,
      game_date: game.gameDate,
      start_time: game.startTime,
      home_team_id: game.homeTeamId,
      away_team_id: game.awayTeamId,
      stadium: game.stadium,
      status: game.status,
      source: 'crawl',
      external_key: buildExternalKey({
        gameDate: game.gameDate,
        awayTeamId: game.awayTeamId,
        homeTeamId: game.homeTeamId,
        doubleHeader: game.doubleHeader,
      }),
      updated_at: new Date().toISOString(),
    })
  }

  if (payload.length === 0) {
    return { received: rows.length, written: 0, errors }
  }

  const { error } = await supabase()
    .from('games')
    .upsert(payload, { onConflict: 'external_key' })

  if (error) throw new Error(`경기 저장에 실패했습니다: ${error.message}`)

  return { received: rows.length, written: payload.length, errors }
}
