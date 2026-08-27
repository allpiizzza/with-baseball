export type RawSearchParams = Record<string, string | string[] | undefined>

/**
 * 지금 쿼리스트링을 유지한 채 일부만 바꾼 링크를 만든다.
 * 값이 null 이면 그 파라미터를 뺀다.
 */
export function withParams(
  pathname: string,
  current: RawSearchParams,
  overrides: Record<string, string | string[] | null>,
): string {
  const params = new URLSearchParams()

  const append = (key: string, value: string | string[]) => {
    if (Array.isArray(value)) for (const v of value) params.append(key, v)
    else params.append(key, value)
  }

  for (const [key, value] of Object.entries(current)) {
    if (key in overrides || value === undefined) continue
    append(key, value)
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) continue
    append(key, value)
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
