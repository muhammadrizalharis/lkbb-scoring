import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { updateCategoryAction } from '../actions'
import { AdminForm, Field } from '../AdminForm'

export const dynamic = 'force-dynamic'

export default async function AdminCategoryPage() {
  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      categories: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { judges: true } }, groups: { include: { criteria: true } } },
      },
    },
  })
  if (!event) return <p>Event tidak ditemukan.</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bobot Kategori</h1>
        <p className="text-sm text-muted-foreground">
          Bobot 1 berarti nilai dipakai apa adanya. Ubah bila Juara Umum memakai persentase tertentu.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {event.categories.map((category) => {
          const criteria = category.groups.reduce((n, g) => n + g.criteria.length, 0)
          return (
            <div key={category.id} className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border">
              <h2 className="font-semibold">{category.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {criteria} butir · rentang {category.minScore}–{category.maxScore} · {category._count.judges} juri
              </p>

              <div className="mt-4">
                <AdminForm action={updateCategoryAction} submitLabel="Simpan">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <Field
                    label="Bobot"
                    name="weight"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={category.weight}
                    className="w-28"
                  />
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      name="includeInOverall"
                      defaultChecked={category.includeInOverall}
                      className="h-4 w-4"
                    />
                    Masuk Juara Umum
                  </label>
                </AdminForm>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
