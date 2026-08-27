'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireMinRole } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'

export type AdminState = { ok?: boolean; error?: string; message?: string }

async function currentEvent() {
  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } })
  if (!event) throw new Error('Event tidak ditemukan')
  return event
}

const teamSchema = z.object({
  number: z.coerce.number().int().min(1).max(999),
  name: z.string().trim().min(1).max(120),
  school: z.string().trim().max(120).optional(),
})

export async function addTeamAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    await requireMinRole('ADMIN')
  } catch {
    return { error: 'Hanya admin yang boleh mengubah data ini.' }
  }

  const parsed = teamSchema.safeParse({
    number: formData.get('number'),
    name: formData.get('name'),
    school: formData.get('school') ?? undefined,
  })
  if (!parsed.success) return { error: 'Nomor urut dan nama tim wajib diisi dengan benar.' }

  const event = await currentEvent()
  const exists = await prisma.team.findUnique({
    where: { eventId_number: { eventId: event.id, number: parsed.data.number } },
  })
  if (exists) return { error: `Nomor urut ${parsed.data.number} sudah dipakai.` }

  await prisma.team.create({
    data: {
      eventId: event.id,
      number: parsed.data.number,
      name: parsed.data.name,
      school: parsed.data.school || null,
    },
  })

  revalidatePath('/admin/tim')
  revalidatePath('/input')
  return { ok: true }
}

export async function deleteTeamAction(formData: FormData) {
  await requireMinRole('ADMIN')
  const id = String(formData.get('id') ?? '')
  const scored = await prisma.scoreItem.count({ where: { sheet: { teamId: id } } })
  // Lindungi data lomba: tim yang sudah punya nilai tidak boleh terhapus.
  if (scored === 0) await prisma.team.delete({ where: { id } })
  revalidatePath('/admin/tim')
  revalidatePath('/input')
}

const judgeSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(120),
  categoryId: z.string().min(1),
})

export async function addJudgeAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    await requireMinRole('ADMIN')
  } catch {
    return { error: 'Hanya admin yang boleh mengubah data ini.' }
  }

  const parsed = judgeSchema.safeParse({
    code: formData.get('code'),
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
  })
  if (!parsed.success) return { error: 'Kode, nama, dan kategori juri wajib diisi.' }

  const event = await currentEvent()
  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, eventId: event.id },
  })
  if (!category) return { error: 'Kategori tidak dikenal.' }

  const exists = await prisma.judge.findUnique({
    where: { eventId_code: { eventId: event.id, code: parsed.data.code } },
  })
  if (exists) return { error: `Kode juri "${parsed.data.code}" sudah dipakai.` }

  await prisma.judge.create({
    data: {
      eventId: event.id,
      categoryId: category.id,
      code: parsed.data.code,
      name: parsed.data.name,
    },
  })

  revalidatePath('/admin/juri')
  revalidatePath('/input')
  return { ok: true }
}

export async function deleteJudgeAction(formData: FormData) {
  await requireMinRole('ADMIN')
  const id = String(formData.get('id') ?? '')
  const scored = await prisma.scoreItem.count({ where: { sheet: { judgeId: id } } })
  if (scored === 0) await prisma.judge.delete({ where: { id } })
  revalidatePath('/admin/juri')
  revalidatePath('/input')
}

const weightSchema = z.object({
  categoryId: z.string().min(1),
  weight: z.coerce.number().min(0).max(100),
  includeInOverall: z.boolean(),
})

export async function updateCategoryAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    await requireMinRole('ADMIN')
  } catch {
    return { error: 'Hanya admin yang boleh mengubah data ini.' }
  }

  const parsed = weightSchema.safeParse({
    categoryId: formData.get('categoryId'),
    weight: formData.get('weight'),
    includeInOverall: formData.get('includeInOverall') === 'on',
  })
  if (!parsed.success) return { error: 'Bobot tidak valid.' }

  const event = await currentEvent()
  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, eventId: event.id },
  })
  if (!category) return { error: 'Kategori tidak dikenal.' }

  await prisma.category.update({
    where: { id: category.id },
    data: { weight: parsed.data.weight, includeInOverall: parsed.data.includeInOverall },
  })

  revalidatePath('/admin/kategori')
  revalidatePath('/rekap')
  return { ok: true }
}

/**
 * Menghapus SELURUH data lomba (tim, juri, nilai, penalti) untuk memulai event baru.
 * Rubrik dan akun pengguna DIPERTAHANKAN. Khusus Super Admin, butuh ketik konfirmasi.
 */
export async function resetEventDataAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let session
  try {
    session = await requireMinRole('SUPER_ADMIN')
  } catch {
    return { error: 'Hanya Super Admin yang boleh mereset data lomba.' }
  }

  if (String(formData.get('confirm') ?? '').trim().toUpperCase() !== 'HAPUS') {
    return { error: 'Ketik HAPUS untuk mengonfirmasi.' }
  }

  const event = await currentEvent()

  const summary = await prisma.$transaction(async (tx) => {
    const teams = await tx.team.count({ where: { eventId: event.id } })
    const judges = await tx.judge.count({ where: { eventId: event.id } })
    const sheets = await tx.scoreSheet.count({ where: { eventId: event.id } })
    // Urutan tak wajib karena relasi ber-cascade, tapi eksplisit agar jelas.
    await tx.penalty.deleteMany({ where: { eventId: event.id } })
    await tx.scoreSheet.deleteMany({ where: { eventId: event.id } })
    await tx.judge.deleteMany({ where: { eventId: event.id } })
    await tx.team.deleteMany({ where: { eventId: event.id } })
    await tx.event.update({ where: { id: event.id }, data: { recapOpen: false } })
    await tx.auditLog.create({
      data: {
        userId: session.userId,
        action: 'RESET_EVENT_DATA',
        entity: 'Event',
        entityId: event.id,
        detail: { teams, judges, sheets },
      },
    })
    return { teams, judges, sheets }
  })

  revalidatePath('/')
  revalidatePath('/input')
  revalidatePath('/rekap')
  revalidatePath('/admin/tim')
  revalidatePath('/admin/juri')

  return { ok: true, message: `Terhapus: ${summary.teams} tim, ${summary.judges} juri, ${summary.sheets} lembar nilai.` }
}
