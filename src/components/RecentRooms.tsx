'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'

import {
  getRecentRoomsServerSnapshot,
  getRecentRoomsSnapshot,
  subscribeRecentRooms,
} from '@/lib/recent-rooms'

/** 이 브라우저에서 최근에 열어본 방. */
export function RecentRooms() {
  const rooms = useSyncExternalStore(
    subscribeRecentRooms,
    getRecentRoomsSnapshot,
    getRecentRoomsServerSnapshot,
  )

  if (rooms.length === 0) return null

  return (
    <section>
      <h2 className="text-sm font-medium text-muted">최근 본 방</h2>
      <ul className="mt-2 space-y-1.5">
        {rooms.map((room) => (
          <li key={room.slug}>
            <Link
              href={`/rooms/${room.slug}`}
              className="flex min-h-11 items-center rounded-lg border border-border bg-surface px-3.5 text-sm hover:bg-surface-muted"
            >
              {room.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
