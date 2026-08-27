import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { RubricForm, Field } from './RubricForm'
import { createCategoryAction, deleteCategoryAction, moveCategoryAction } from './actions'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Format Penilaian (Rubrik)</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Susun sendiri kategori, grup, butir, dan pilihan nilainya. Perubahan langsung dipakai di
          halaman input dan rekap. Setelah sebuah kategori memiliki nilai tersimpan, strukturnya
          dikunci agar data lomba tidak rusak.
        </p>
      </div>

      <div className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border">
        <h2 className="mb-3 font-semibold">Tambah kategori</h2>
        <RubricForm action={createCategoryAction} submitLabel="Tambah kategori">
          <Field label="Kode" name="code" required placeholder="PBB" className="w-32" />
          <Field label="Nama kategori" name="name" required placeholder="PBB Gerakan Dasar" />
        </RubricForm>
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
