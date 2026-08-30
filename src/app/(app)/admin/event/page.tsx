import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { updateEventAction } from '../actions'
import { AdminForm, Field } from '../AdminForm'

export const dynamic = 'force-dynamic'

export default async function EventSettingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!hasAtLeast(session.role, 'SUPER_ADMIN')) redirect('/admin')

  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } })
  if (!event) return <p>Event tidak ditemukan.</p>

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground underline">
        ← Kembali ke Pengaturan
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Identitas Lomba</h1>
        <p className="text-sm text-muted-foreground">
          Nama lomba tampil di beranda, rekap, dan cetakan. Aktifkan <b>Mode LIVE</b> agar muncul
          badge “LIVE” di header — menandakan penilaian transparan sedang berlangsung.
        </p>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <AdminForm action={updateEventAction} submitLabel="Simpan">
          <Field label="Nama lomba" name="name" defaultValue={event.name} required placeholder="Contoh: Lomba Cerdas Cermat 2026" />
          <Field label="Penyelenggara (opsional)" name="host" defaultValue={event.host ?? ''} placeholder="Contoh: OSIS SMAN Titian Teras" />
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="liveMode" defaultChecked={event.liveMode} className="h-4 w-4" />
            Mode LIVE (siarkan papan skor ke publik + badge header)
          </label>
        </AdminForm>
      </div>

      <div className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
        Pratinjau badge:{' '}
        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 ring-1 ring-red-500/30 dark:text-red-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-600" />
          </span>
          LIVE · {event.name}
        </span>
      </div>
    </div>
  )
}
