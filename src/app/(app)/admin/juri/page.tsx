import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { addJudgeAction, deleteJudgeAction } from '../actions'
import { AdminForm, Field } from '../AdminForm'

export const dynamic = 'force-dynamic'

export default async function AdminJudgePage() {
  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      categories: { orderBy: { order: 'asc' } },
      judges: {
        orderBy: { code: 'asc' },
        include: { category: true, _count: { select: { sheets: true } } },
      },
    },
  })
  if (!event) return <p>Event tidak ditemukan.</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Juri</h1>
        <p className="text-sm text-slate-500">
          Setiap juri menilai satu kategori. Nilai seluruh juri dalam satu kategori akan dijumlahkan.
        </p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <AdminForm action={addJudgeAction} submitLabel="Tambah juri">
          <Field label="Kode" name="code" required placeholder="J1" className="w-24" />
          <Field label="Nama juri" name="name" required />
          <label className="space-y-1">
            <span className="block text-sm font-medium">Kategori</span>
            <select
              name="categoryId"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              {event.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (maks {c.maxScore})
                </option>
              ))}
            </select>
          </label>
        </AdminForm>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2 w-24">Kode</th>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Kategori</th>
              <th className="px-4 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {event.judges.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  Belum ada juri.
                </td>
              </tr>
            )}
            {event.judges.map((judge) => (
              <tr key={judge.id}>
                <td className="px-4 py-2 font-semibold">{judge.code}</td>
                <td className="px-4 py-2">{judge.name}</td>
                <td className="px-4 py-2 text-slate-500">{judge.category.name}</td>
                <td className="px-4 py-2 text-right">
                  {judge._count.sheets === 0 ? (
                    <form action={deleteJudgeAction}>
                      <input type="hidden" name="id" value={judge.id} />
                      <button className="text-sm text-red-600 hover:underline">Hapus</button>
                    </form>
                  ) : (
                    <span className="text-xs text-slate-400">ada nilai</span>
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
