'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Menyegarkan data server (skor) secara berkala tanpa reload penuh. */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000)
    return () => clearInterval(id)
  }, [router, seconds])
  return null
}
