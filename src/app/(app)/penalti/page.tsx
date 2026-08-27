import Link from 'next/link'
import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { getSession, hasAtLeast } from '@/lib/auth'
import { PenaltyForm } from './PenaltyForm'
import { deletePenaltyAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function PenaltyPage() {
  const session = await getSession()
  const canEdit = !!session && hasAtLeast(session.role, 'OPERATOR')

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      teams: { orderBy: { number: 'asc' } },
      categories: { orderBy: { order: 'asc' } },
      penalties: {
        orderBy: { createdAt: 'desc' },
        include: { team: true, category: true },
      },
    },
  })
  if (!event) return <p>Event tidak ditemukan.</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengurangan Nilai (Penalti)</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Kurangi nilai tim akibat pelanggaran. Pilih <b>kategori</b> agar pengurangan memengaruhi
          medali kategori itu, atau <b>Keseluruhan</b> untuk mengurangi total (dipakai sebagai
          pemecah seri pada metode poin medali).
        </p>
      </div>

      {canEdit ? (
        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <PenaltyForm
            teams={event.teams.map((t) => ({ id: t.id, label: `${t.number}. ${t.name}` }))}
            categories={event.categories.map((c) => ({ id: c.id, label: c.name }))}
          />
        </div>
      ) : (
        <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200 ring-1 ring-warning/30">
          Anda hanya dapat melihat daftar pengurangan nilai (peran Viewer).
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Daftar pengurangan</h2>
        </div>
        {event.penalties.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Belum ada pengurangan nilai.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Tim</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Alasan</th>
                <th className="px-4 py-2 text-right">Poin</th>
                {canEdit && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {event.penalties.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">
                    <span className="mr-1.5 text-muted-foreground tabular-nums">{p.team.number}.</span>
                    {p.team.name}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {p.category ? p.category.name : 'Keseluruhan'}
                  </td>
                  <td className="px-4 py-2">{p.reason}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-red-600">
                    −{p.points}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-2 text-right">
                      <form action={deletePenaltyAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-sm text-red-600 hover:underline">Hapus</button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Link href="/rekap" className="inline-block text-sm text-muted-foreground underline">
        Lihat pengaruhnya di Rekapitulasi →
      </Link>
    </div>
  )
}
