'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireMinRole } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'

export type PenaltyState = { ok?: boolean; error?: string }

async function currentEvent() {
  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } })
  if (!event) throw new Error('Event tidak ditemukan')
  return event
}

const schema = z.object({
  teamId: z.string().min(1),
  categoryId: z.string().optional(),
  reason: z.string().trim().min(1).max(200),
  points: z.coerce.number().int().min(1).max(100000),
})

export async function addPenaltyAction(_prev: PenaltyState, formData: FormData): Promise<PenaltyState> {
  let session
  try {
    session = await requireMinRole('OPERATOR')
  } catch {
    return { error: 'Peran Anda tidak boleh menambah pengurangan nilai.' }
  }

  const parsed = schema.safeParse({
    teamId: formData.get('teamId'),
    categoryId: formData.get('categoryId') || undefined,
    reason: formData.get('reason'),
    points: formData.get('points'),
  })
  if (!parsed.success) return { error: 'Isi tim, alasan, dan poin (minimal 1) dengan benar.' }

  const event = await currentEvent()
  const team = await prisma.team.findFirst({ where: { id: parsed.data.teamId, eventId: event.id } })
  if (!team) return { error: 'Tim tidak dikenal.' }

  let categoryId: string | null = null
  if (parsed.data.categoryId) {
    const cat = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, eventId: event.id } })
    if (!cat) return { error: 'Kategori tidak dikenal.' }
    categoryId = cat.id
  }

  await prisma.$transaction(async (tx) => {
    const penalty = await tx.penalty.create({
      data: { eventId: event.id, teamId: team.id, categoryId, reason: parsed.data.reason, points: parsed.data.points },
    })
    await tx.auditLog.create({
      data: {
        userId: session.userId,
        action: 'ADD_PENALTY',
        entity: 'Penalty',
        entityId: penalty.id,
        detail: { teamId: team.id, categoryId, points: parsed.data.points, reason: parsed.data.reason },
      },
    })
  })

  revalidatePath('/penalti')
  revalidatePath('/rekap')
  revalidatePath('/')
  return { ok: true }
}

export async function deletePenaltyAction(formData: FormData) {
  const session = await requireMinRole('OPERATOR')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const penalty = await prisma.penalty.findUnique({ where: { id } })
  if (!penalty) return
  await prisma.$transaction(async (tx) => {
    await tx.penalty.delete({ where: { id } })
    await tx.auditLog.create({
      data: { userId: session.userId, action: 'DELETE_PENALTY', entity: 'Penalty', entityId: id },
    })
  })
  revalidatePath('/penalti')
  revalidatePath('/rekap')
  revalidatePath('/')
}
