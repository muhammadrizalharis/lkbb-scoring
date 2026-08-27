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
        <p className="max-w-2xl text-sm text-slate-500">
          Susun sendiri kategori, grup, butir, dan pilihan nilainya. Perubahan langsung dipakai di
          halaman input dan rekap. Setelah sebuah kategori memiliki nilai tersimpan, strukturnya
          dikunci agar data lomba tidak rusak.
        </p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-semibold">Tambah kategori</h2>
        <RubricForm action={createCategoryAction} submitLabel="Tambah kategori">
          <Field label="Kode" name="code" required placeholder="PBB" className="w-32" />
          <Field label="Nama kategori" name="name" required placeholder="PBB Gerakan Dasar" />
        </RubricForm>
      </div>

      <div className="space-y-3">
        {categories.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Belum ada kategori. Tambahkan kategori pertama di atas.
          </p>
        )}
        {categories.map((category, i) => {
          const criteria = category.groups.reduce((n, g) => n + g._count.criteria, 0)
          return (
            <div
              key={category.id}
              className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-col">
                <form action={moveCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    disabled={i === 0}
                    className="rounded px-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
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
                    className="rounded px-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
                    title="Turun"
                  >
                    ▼
                  </button>
                </form>
              </div>

              <div className="flex-1">
                <p className="font-semibold">
                  <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                    {category.code}
                  </span>
                  {category.name}
                </p>
                <p className="text-sm text-slate-500">
                  {category.groups.length} grup · {criteria} butir · rentang {category.minScore}–
                  {category.maxScore} · {category._count.judges} juri
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/rubrik/${category.id}`}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Sunting
                </Link>
                {category._count.judges === 0 && (
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
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
