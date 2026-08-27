import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { OverallForm } from './OverallForm'

export const dynamic = 'force-dynamic'

export default async function JuaraUmumPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!hasAtLeast(session.role, 'SUPER_ADMIN')) redirect('/admin')

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: { categories: { orderBy: { order: 'asc' } } },
  })
  if (!event) return <p>Event tidak ditemukan.</p>

  const included = event.categories.filter((c) => c.includeInOverall)
  const excluded = event.categories.filter((c) => !c.includeInOverall)

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground underline">
        ← Kembali ke Pengaturan
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perhitungan Juara Umum</h1>
        <p className="text-sm text-muted-foreground">
          Tentukan cara menentukan Juara Umum. Perubahan langsung terlihat di halaman Rekapitulasi.
        </p>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <OverallForm
          overallMethod={event.overallMethod}
          goldPoints={event.goldPoints}
          silverPoints={event.silverPoints}
          bronzePoints={event.bronzePoints}
          medalPlaces={event.medalPlaces}
        />
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <h2 className="font-semibold">Kategori yang dihitung untuk Juara Umum</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kategori yang dihitung menghasilkan medali. Atur di{' '}
          <Link href="/admin/kategori" className="font-medium text-primary underline">
            Bobot Kategori
          </Link>{' '}
          (centang “Masuk Juara Umum”).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {included.map((c) => (
            <span key={c.id} className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {c.name}
            </span>
          ))}
          {excluded.map((c) => (
            <span key={c.id} className="rounded-lg bg-muted px-2.5 py-1 text-sm text-muted-foreground line-through">
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
