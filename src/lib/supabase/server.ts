import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * service-role 클라이언트.
 *
 * 브라우저는 Supabase에 직접 접근하지 않는다. 모든 DB 접근은 서버 컴포넌트와
 * Server Action에서 이 클라이언트를 통해서만 이뤄지고, 테이블은 RLS
 * deny-by-default로 잠겨 있다. 'server-only' import가 이 모듈이 클라이언트
 * 번들에 섞여 들어가면 빌드를 깨뜨린다.
 */
let cached: SupabaseClient | null = null

export function supabase(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. ' +
        '.env.example 을 참고해 .env.local 을 만들어 주세요.',
    )
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
