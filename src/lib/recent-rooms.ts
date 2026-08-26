export interface RecentRoom {
  slug: string
  title: string
}

const STORAGE_KEY = 'with-baseball:recent-rooms'
const MAX = 8
const EMPTY: RecentRoom[] = []

/**
 * "최근 본 방" 목록. 이 브라우저에만 있는 편의 기능이라 localStorage 로 충분하다.
 *
 * useSyncExternalStore 로 읽기 때문에 스냅샷은 참조가 안정적이어야 한다 —
 * 원본 문자열이 그대로면 파싱한 배열을 그대로 돌려준다. 매번 새 배열을 만들면
 * 렌더 루프에 빠진다.
 */
let cachedRaw: string | null = null
let cachedValue: RecentRoom[] = EMPTY

const listeners = new Set<() => void>()

export function subscribeRecentRooms(onChange: () => void): () => void {
  listeners.add(onChange)
  // 다른 탭에서 방을 열었을 때도 반영된다.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function getRecentRoomsSnapshot(): RecentRoom[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // 시크릿 모드나 저장소 차단 환경.
    return EMPTY
  }

  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  cachedValue = parse(raw)
  return cachedValue
}

/** 서버 렌더 시점엔 localStorage 가 없다. 항상 같은 참조를 돌려줘야 한다. */
export function getRecentRoomsServerSnapshot(): RecentRoom[] {
  return EMPTY
}

export function rememberRoom(room: RecentRoom): void {
  try {
    const next = [room, ...getRecentRoomsSnapshot().filter((r) => r.slug !== room.slug)].slice(
      0,
      MAX,
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    return
  }
  for (const listener of listeners) listener()
}

function parse(raw: string | null): RecentRoom[] {
  if (!raw) return EMPTY
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY
    const rooms = parsed.filter(
      (r): r is RecentRoom =>
        typeof r === 'object' &&
        r !== null &&
        typeof (r as RecentRoom).slug === 'string' &&
        typeof (r as RecentRoom).title === 'string',
    )
    return rooms.length > 0 ? rooms : EMPTY
  } catch {
    return EMPTY
  }
}
