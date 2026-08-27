import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ScoreForm } from '../../ScoreForm'

export const dynamic = 'force-dynamic'

export default async function SheetPage({
  params,
}: {
  params: Promise<{ teamId: string; judgeId: string }>
}) {
  const { teamId, judgeId } = await params

  const [team, judge] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.judge.findUnique({
      where: { id: judgeId },
      include: {
        category: {
          include: {
            groups: { orderBy: { order: 'asc' }, include: { criteria: { orderBy: { order: 'asc' } } } },
          },
        },
      },
    }),
  ])

  if (!team || !judge || judge.eventId !== team.eventId) notFound()

  const sheet = await prisma.scoreSheet.findUnique({
    where: { teamId_judgeId_categoryId: { teamId, judgeId, categoryId: judge.categoryId } },
    include: { items: true },
  })

  const initialValues = Object.fromEntries(sheet?.items.map((i) => [i.criterionId, i.value]) ?? [])

  return (
    <div className="space-y-4">
      <Link href="/input" className="text-sm text-muted-foreground underline">
        ← Kembali ke daftar
      </Link>

      <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
        <h1 className="text-xl font-bold">
          <span className="text-muted-foreground tabular-nums">{team.number}</span> {team.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {judge.category.name} · Juri {judge.code} ({judge.name})
        </p>
      </div>

      <ScoreForm
        teamId={team.id}
        judgeId={judge.id}
        groups={judge.category.groups.map((g) => ({
          id: g.id,
          code: g.code,
          name: g.name,
          criteria: g.criteria.map((c) => ({
            id: c.id,
            name: c.name,
            order: c.order,
            options: c.options,
          })),
        }))}
        initialValues={initialValues}
        status={sheet?.status ?? null}
        maxScore={judge.category.maxScore}
      />
    </div>
  )
}
