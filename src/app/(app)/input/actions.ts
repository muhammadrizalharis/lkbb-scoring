'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireSession, hasAtLeast } from '@/lib/auth'

const schema = z.object({
  teamId: z.string().min(1),
  judgeId: z.string().min(1),
  finalize: z.boolean(),
  values: z.record(z.string(), z.number().int()),
})

export type SaveState = { ok?: boolean; error?: string; total?: number; missing?: number }

export async function saveSheetAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  let session
  try {
    session = await requireSession()
  } catch {
    return { error: 'Sesi berakhir. Silakan masuk kembali.' }
  }

  if (session.role === 'VIEWER') return { error: 'Peran Anda tidak boleh mengubah nilai.' }

  const values: Record<string, number> = {}
  const notes: Record<string, string> = {}
  for (const [key, raw] of formData.entries()) {
    if (key.startsWith('c:')) {
      const text = String(raw)
      if (text === '') continue
      values[key.slice(2)] = Number(text)
    } else if (key.startsWith('n:')) {
      const text = String(raw).trim().slice(0, 500)
      if (text) notes[key.slice(2)] = text
    }
  }

  const parsed = schema.safeParse({
    teamId: formData.get('teamId'),
    judgeId: formData.get('judgeId'),
    finalize: formData.get('finalize') === '1',
    values,
  })
  if (!parsed.success) return { error: 'Data tidak valid.' }

  const { teamId, judgeId, finalize } = parsed.data

  const judge = await prisma.judge.findUnique({
    where: { id: judgeId },
    include: { category: { include: { groups: { include: { criteria: true } } } } },
  })
  const team = await prisma.team.findUnique({ where: { id: teamId } })
  if (!judge || !team || judge.eventId !== team.eventId) return { error: 'Tim atau juri tidak dikenal.' }

  // Cegah input dobel: lembar yang sudah FINAL hanya boleh diubah admin ke atas.
  const existing = await prisma.scoreSheet.findUnique({
    where: { teamId_judgeId_categoryId: { teamId, judgeId, categoryId: judge.categoryId } },
    select: { status: true },
  })
  if (existing?.status === 'FINAL' && !hasAtLeast(session.role, 'ADMIN')) {
    return { error: 'Lembar ini sudah difinalkan operator lain. Minta admin membukanya bila perlu koreksi.' }
  }

  const criteria = judge.category.groups.flatMap((g) => g.criteria)
  const allowed = new Map(criteria.map((c) => [c.id, c.options]))

  // Tolak butir asing dan nilai di luar daftar resmi rubrik.
  const entries: { criterionId: string; value: number; note: string | null }[] = []
  for (const [criterionId, value] of Object.entries(parsed.data.values)) {
    const options = allowed.get(criterionId)
    if (!options) return { error: 'Terdapat butir penilaian yang tidak dikenal.' }
    if (!options.includes(value)) return { error: 'Terdapat nilai di luar pilihan yang sah.' }
    entries.push({ criterionId, value, note: notes[criterionId] ?? null })
  }

  const missing = criteria.length - entries.length
  if (finalize && missing > 0) {
    return { error: `Masih ada ${missing} butir yang belum diisi.`, missing }
  }

  const total = entries.reduce((sum, e) => sum + e.value, 0)

  await prisma.$transaction(async (tx) => {
    const sheet = await tx.scoreSheet.upsert({
      where: { teamId_judgeId_categoryId: { teamId, judgeId, categoryId: judge.categoryId } },
      update: {
        total,
        status: finalize ? 'FINAL' : 'DRAFT',
        finalizedAt: finalize ? new Date() : null,
        enteredById: session.userId,
      },
      create: {
        eventId: judge.eventId,
        teamId,
        judgeId,
        categoryId: judge.categoryId,
        total,
        status: finalize ? 'FINAL' : 'DRAFT',
        finalizedAt: finalize ? new Date() : null,
        enteredById: session.userId,
      },
    })

    await tx.scoreItem.deleteMany({ where: { sheetId: sheet.id } })
    if (entries.length > 0) {
      await tx.scoreItem.createMany({
        data: entries.map((e) => ({ sheetId: sheet.id, criterionId: e.criterionId, value: e.value, note: e.note })),
      })
    }

    await tx.auditLog.create({
      data: {
        userId: session.userId,
        action: finalize ? 'FINALIZE_SHEET' : 'SAVE_SHEET',
        entity: 'ScoreSheet',
        entityId: sheet.id,
        detail: { teamId, judgeId, categoryId: judge.categoryId, total },
      },
    })
  })

  revalidatePath('/input')
  revalidatePath('/rekap')
  revalidatePath('/')

  return { ok: true, total, missing }
}
