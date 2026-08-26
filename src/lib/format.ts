const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** '2026-04-01' -> '4/1(수)' */
export function formatGameDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  // 로컬 타임존에 흔들리지 않도록 UTC로 만들고 UTC 요일을 읽는다.
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${month}/${day}(${weekday})`
}

/** '18:30:00' -> '18:30', null -> '시간 미정' */
export function formatStartTime(time: string | null): string {
  if (!time) return '시간 미정'
  return time.slice(0, 5)
}

/** 오늘 날짜를 'YYYY-MM-DD'로. 일정 필터의 기본 시작일. */
export function todayIso(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
