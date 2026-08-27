import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, hasAtLeast } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import { RubricForm, Field } from '../RubricForm'
import { CriterionEditor } from '../CriterionEditor'
import {
  updateCategoryInfoAction,
  addGroupAction,
  updateGroupAction,
  deleteGroupAction,
  addCriterionAction,
  moveGroupAction,
} from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!hasAtLeast(session.role, 'SUPER_ADMIN')) redirect('/admin')

  const { categoryId } = await params

  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } })
  if (!event) return <p>Event tidak ditemukan.</p>

  const category = await prisma.category.findFirst({
    where: { id: categoryId, eventId: event.id },
    include: {
      groups: {
        orderBy: { order: 'asc' },
        include: { criteria: { orderBy: { order: 'asc' } } },
      },
    },
  })
  if (!category) notFound()

  const scoredCount = await prisma.scoreItem.count({ where: { sheet: { categoryId: category.id } } })
  const locked = scoredCount > 0
  const criteriaTotal = category.groups.reduce((n, g) => n + g.criteria.length, 0)

  return (
    <div className="space-y-6">
      <Link href="/admin/rubrik" className="text-sm text-slate-600 underline">
        ← Kembali ke daftar kategori
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Sunting: {category.name}</h1>
        <p className="text-sm text-slate-500">
          {criteriaTotal} butir · rentang otomatis {category.minScore}–{category.maxScore}
        </p>
      </div>

      {locked && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Kategori ini sudah memiliki nilai tersimpan, jadi <b>struktur terkunci</b>. Nama masih boleh
          diubah, tetapi menambah/menghapus butir dan mengubah pilihan nilai dinonaktifkan agar nilai
          yang sudah masuk tidak menjadi tidak sah.
        </div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-semibold">Identitas kategori</h2>
        <RubricForm action={updateCategoryInfoAction} submitLabel="Simpan" clearOnSuccess={false}>
          <input type="hidden" name="categoryId" value={category.id} />
          <Field label="Kode" name="code" defaultValue={category.code} required className="w-32" disabled={locked} />
          <Field label="Nama kategori" name="name" defaultValue={category.name} required />
        </RubricForm>
        {locked && <p className="mt-2 text-xs text-slate-400">Kode terkunci karena sudah ada nilai.</p>}
      </div>

      <div className="space-y-4">
        {category.groups.map((group, gi) => (
          <section key={group.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2">
              <div className="flex-1">
                <RubricForm
                  action={updateGroupAction}
                  submitLabel="Simpan nama"
                  clearOnSuccess={false}
                  className="flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="groupId" value={group.id} />
                  <label className="space-y-1">
                    <span className="block text-xs font-medium text-slate-500">Kode</span>
                    <input
                      name="code"
                      defaultValue={group.code ?? ''}
                      placeholder="A"
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs font-medium text-slate-500">Nama grup</span>
                    <input
                      name="name"
                      defaultValue={group.name}
                      required
                      className="w-72 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
                    />
                  </label>
                </RubricForm>
              </div>
              <div className="flex items-center gap-1">
                <form action={moveGroupAction}>
                  <input type="hidden" name="id" value={group.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button disabled={gi === 0} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30" title="Naik">
                    ▲
                  </button>
                </form>
                <form action={moveGroupAction}>
                  <input type="hidden" name="id" value={group.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    disabled={gi === category.groups.length - 1}
                    className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                    title="Turun"
                  >
                    ▼
                  </button>
                </form>
                {!locked && (
                  <form action={deleteGroupAction}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <button className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50">Hapus grup</button>
                  </form>
                )}
              </div>
            </div>

            <ul className="divide-y divide-slate-100">
              {group.criteria.length === 0 && (
                <li className="px-4 py-3 text-sm text-slate-400">Belum ada butir pada grup ini.</li>
              )}
              {group.criteria.map((criterion, ci) => (
                <CriterionEditor
                  key={criterion.id}
                  criterion={{
                    id: criterion.id,
                    name: criterion.name,
                    order: criterion.order,
                    options: criterion.options,
                  }}
                  index={ci}
                  isFirst={ci === 0}
                  isLast={ci === group.criteria.length - 1}
                  locked={locked}
                />
              ))}
            </ul>

            {!locked && (
              <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-3">
                <RubricForm action={addCriterionAction} submitLabel="Tambah butir">
                  <input type="hidden" name="groupId" value={group.id} />
                  <Field label="Nama butir" name="name" required placeholder="Hadap Kiri Maju" />
                  <Field
                    label="Pilihan nilai"
                    name="options"
                    required
                    placeholder="10, 14, 16, 18, 20"
                    hint="Pisahkan dengan koma"
                    className="w-64"
                  />
                </RubricForm>
              </div>
            )}
          </section>
        ))}
      </div>

      {!locked && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-semibold">Tambah grup baru</h2>
          <RubricForm action={addGroupAction} submitLabel="Tambah grup">
            <input type="hidden" name="categoryId" value={category.id} />
            <Field label="Kode (opsional)" name="code" placeholder="A" className="w-24" />
            <Field label="Nama grup" name="name" required placeholder="Gerakan Berjalan ke Berjalan" />
          </RubricForm>
        </div>
      )}
    </div>
  )
}
