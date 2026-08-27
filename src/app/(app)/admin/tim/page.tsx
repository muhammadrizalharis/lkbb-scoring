import Link from 'next/link'
import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { addTeamAction, deleteTeamAction } from '../actions'
import { AdminForm, Field } from '../AdminForm'

export const dynamic = 'force-dynamic'

export default async function AdminTeamPage() {
  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      teams: {
        orderBy: { number: 'asc' },
        include: { _count: { select: { sheets: true } } },
      },
    },
  })
  if (!event) return <p>Event tidak ditemukan.</p>

  const nextNumber = (event.teams.at(-1)?.number ?? 0) + 1

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground underline">
        ← Kembali ke Pengaturan
      </Link>
      <h1 className="text-2xl font-bold">Tim Peserta</h1>

      <div className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border">
        <AdminForm action={addTeamAction} submitLabel="Tambah tim">
          <Field label="No. urut" name="number" type="number" min={1} defaultValue={nextNumber} required className="w-24" />
          <Field label="Nama tim" name="name" required placeholder="Contoh: Paskibra SMAN 1" />
          <Field label="Sekolah (opsional)" name="school" />
        </AdminForm>
      </div>

      <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-4 py-2 w-20">No</th>
              <th className="px-4 py-2">Nama tim</th>
              <th className="px-4 py-2">Sekolah</th>
              <th className="px-4 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {event.teams.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                  Belum ada tim.
                </td>
              </tr>
            )}
            {event.teams.map((team) => (
              <tr key={team.id}>
                <td className="px-4 py-2 tabular-nums">{team.number}</td>
                <td className="px-4 py-2 font-medium">{team.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{team.school ?? '–'}</td>
                <td className="px-4 py-2 text-right">
                  {team._count.sheets === 0 ? (
                    <form action={deleteTeamAction}>
                      <input type="hidden" name="id" value={team.id} />
                      <button className="text-sm text-red-600 hover:underline">Hapus</button>
                    </form>
                  ) : (
                    <span className="text-xs text-muted-foreground">ada nilai</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
