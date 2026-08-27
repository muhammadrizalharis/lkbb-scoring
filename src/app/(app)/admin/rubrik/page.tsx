import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { RubricForm, Field } from './RubricForm'
import { createCategoryAction, deleteCategoryAction, moveCategoryAction, setPublishedAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function RubricPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!hasAtLeast(session.role, 'SUPER_ADMIN')) redirect('/admin')

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      categories: {
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { judges: true } },
          groups: { include: { _count: { select: { criteria: true } } } },
        },
      },
    },
  })
  if (!event) return <p>Event tidak ditemukan.</p>

  const categories = event.categories
  const published = event.published

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground underline">
        ← Kembali ke Pengaturan
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Format Penilaian (Rubrik)</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Susun sendiri kategori, grup, butir, dan pilihan nilainya. Perubahan langsung dipakai di
          halaman input dan rekap. Saat siap, <b>publish</b> untuk mengunci rubrik selama lomba.
        </p>
      </div>

      {/* Status publish + toggle */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 shadow-sm ring-1 ${
          published ? 'bg-emerald-500/10 ring-emerald-500/30' : 'bg-card ring-border'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`grid size-10 place-items-center rounded-xl ${
              published ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              {published ? <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z" /> : <path d="M7 11V7a5 5 0 0 1 9.9-1M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" />}
            </svg>
          </span>
          <div>
            <p className="font-semibold">
              {published ? 'Lomba sudah dipublish — rubrik terkunci' : 'Mode setup — rubrik bisa diedit'}
            </p>
            <p className="text-sm text-muted-foreground">
              {published
                ? 'Struktur penilaian dikunci agar tidak berubah saat penjurian.'
                : 'Selesaikan rubrik, lalu publish untuk mengunci sebelum lomba dimulai.'}
            </p>
          </div>
        </div>
        <form action={setPublishedAction}>
          <input type="hidden" name="published" value={published ? '0' : '1'} />
          <button
            className={`rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg transition hover:opacity-95 ${
              published
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-600/25'
                : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-600/25'
            }`}
          >
            {published ? 'Batalkan publish' : 'Publish untuk lomba'}
          </button>
        </form>
      </div>

      <div className={`rounded-xl bg-card p-5 shadow-sm ring-1 ring-border ${published ? 'opacity-60' : ''}`}>
        <h2 className="mb-3 font-semibold">Tambah kategori</h2>
        {published ? (
          <p className="text-sm text-muted-foreground">Batalkan publish dulu untuk menambah kategori.</p>
        ) : (
          <RubricForm action={createCategoryAction} submitLabel="Tambah kategori">
            <Field label="Kode" name="code" required placeholder="PBB" className="w-32" />
            <Field label="Nama kategori" name="name" required placeholder="PBB Gerakan Dasar" />
          </RubricForm>
        )}
      </div>

      <div className="space-y-3">
        {categories.length === 0 && (
          <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
            Belum ada kategori. Tambahkan kategori pertama di atas.
          </p>
        )}
        {categories.map((category, i) => {
          const criteria = category.groups.reduce((n, g) => n + g._count.criteria, 0)
          return (
            <div
              key={category.id}
              className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border"
            >
              <div className="flex flex-col">
                <form action={moveCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    disabled={i === 0}
                    className="rounded px-2 text-muted-foreground transition hover:bg-accent disabled:opacity-30"
                    title="Naik"
                  >
                    ▲
                  </button>
                </form>
                <form action={moveCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    disabled={i === categories.length - 1}
                    className="rounded px-2 text-muted-foreground transition hover:bg-accent disabled:opacity-30"
                    title="Turun"
                  >
                    ▼
                  </button>
                </form>
              </div>

              <div className="flex-1">
                <p className="font-semibold">
                  <span className="mr-2 rounded bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                    {category.code}
                  </span>
                  {category.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {category.groups.length} grup · {criteria} butir · rentang {category.minScore}–
                  {category.maxScore} · {category._count.judges} juri
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/rubrik/${category.id}`}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Sunting
                </Link>
                {category._count.judges === 0 && (
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-danger/10">
                      Hapus
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
