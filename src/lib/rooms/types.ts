export type VoteValue = 'yes' | 'maybe' | 'no'

export const VOTE_VALUES: VoteValue[] = ['yes', 'maybe', 'no']

export const VOTE_LABEL: Record<VoteValue, string> = {
  yes: 'O',
  maybe: '△',
  no: 'X',
}

export interface Room {
  id: string
  slug: string
  title: string
  created_at: string
}

export interface Participant {
  id: string
  nickname: string
  created_at: string
}

export interface VoteRecord {
  participant_id: string
  game_id: string
  value: VoteValue
}
