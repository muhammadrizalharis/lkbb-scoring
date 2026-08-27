'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireMinRole } from '@/lib/auth'
import { EVENT_SLUG } from '@/lib/config'
import type { Prisma } from '@/generated/prisma/client'

export type RubricState = { ok?: boolean; error?: string }

async function currentEvent() {
  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } })
  if (!event) throw new Error('Event tidak ditemukan')
  return event
}

/** Benar bila kategori sudah punya nilai tersimpan; ubah struktur diblokir agar data aman. */
async function categoryHasScores(categoryId: string) {
  const count = await prisma.scoreItem.count({ where: { sheet: { categoryId } } })
  return count > 0
}

/** Hitung ulang rentang min/maks kategori dari seluruh opsi butir di dalamnya. */
async function recomputeCategory(tx: Prisma.TransactionClient, categoryId: string) {
  const groups = await tx.criterionGroup.findMany({
    where: { categoryId },
    include: { criteria: true },
  })
  let min = 0
  let max = 0
  for (const group of groups) {
    for (const criterion of group.criteria) {
      if (criterion.options.length === 0) continue
      min += Math.min(...criterion.options)
      max += Math.max(...criterion.options)
    }
  }
  await tx.category.update({ where: { id: categoryId }, data: { minScore: min, maxScore: max } })
}

/** Ubah daftar "6, 10, 14" menjadi array angka bulat unik terurut, atau pesan galat. */
function parseOptions(raw: string): { values?: number[]; error?: string } {
  const parts = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return { error: 'Isi minimal satu nilai, contoh: 6, 10, 14, 18' }

  const values: number[] = []
  for (const part of parts) {
    const n = Number(part)
    if (!Number.isInteger(n)) return { error: `"${part}" bukan bilangan bulat.` }
    if (n < 0) return { error: 'Nilai tidak boleh negatif.' }
    if (!values.includes(n)) values.push(n)
  }
  if (values.length > 30) return { error: 'Terlalu banyak pilihan (maksimal 30).' }
  values.sort((a, b) => a - b)
  return { values }
}

function forbid(e: unknown): RubricState {
  if (e instanceof Error && (e.message === 'FORBIDDEN' || e.message === 'UNAUTHORIZED')) {
    return { error: 'Hanya Super Admin yang boleh mengubah format penilaian.' }
  }
  throw e
}

// ---- Kategori -------------------------------------------------------------

const categoryCreateSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(120),
})

export async function createCategoryAction(_prev: RubricState, formData: FormData): Promise<RubricState> {
  try {
    await requireMinRole('SUPER_ADMIN')
  } catch (e) {
    return forbid(e)
  }

  const parsed = categoryCreateSchema.safeParse({
    code: formData.get('code'),
    name: formData.get('name'),
  })
  if (!parsed.success) return { error: 'Kode dan nama kategori wajib diisi.' }

  const event = await currentEvent()
  const code = parsed.data.code.toUpperCase()
  const exists = await prisma.category.findUnique({
    where: { eventId_code: { eventId: event.id, code } },
  })
  if (exists) return { error: `Kode kategori "${code}" sudah dipakai.` }

  const last = await prisma.category.findFirst({
    where: { eventId: event.id },
    orderBy: { order: 'desc' },
  })

  await prisma.category.create({
    data: {
      eventId: event.id,
      code,
      name: parsed.data.name,
      order: (last?.order ?? -1) + 1,
      minScore: 0,
      maxScore: 0,
    },
  })

  revalidatePath('/admin/rubrik')
  return { ok: true }
}

const categoryUpdateSchema = z.object({
  categoryId: z.string().min(1),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(120),
})

export async function updateCategoryInfoAction(_prev: RubricState, formData: FormData): Promise<RubricState> {
  try {
    await requireMinRole('SUPER_ADMIN')
  } catch (e) {
    return forbid(e)
  }

  const parsed = categoryUpdateSchema.safeParse({
    categoryId: formData.get('categoryId'),
    code: formData.get('code'),
    name: formData.get('name'),
  })
  if (!parsed.success) return { error: 'Kode dan nama kategori wajib diisi.' }

  const event = await currentEvent()
  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, eventId: event.id },
  })
  if (!category) return { error: 'Kategori tidak dikenal.' }

  const code = parsed.data.code.toUpperCase()
  if (code !== category.code) {
    if (await categoryHasScores(category.id)) {
      return { error: 'Kode tidak bisa diubah karena kategori ini sudah memiliki nilai.' }
    }
    const clash = await prisma.category.findUnique({
      where: { eventId_code: { eventId: event.id, code } },
    })
    if (clash) return { error: `Kode kategori "${code}" sudah dipakai.` }
  }

  await prisma.category.update({
    where: { id: category.id },
    data: { code, name: parsed.data.name },
  })

  revalidatePath('/admin/rubrik')
  revalidatePath(`/admin/rubrik/${category.id}`)
  return { ok: true }
}

export async function deleteCategoryAction(formData: FormData) {
  await requireMinRole('SUPER_ADMIN')
  const id = String(formData.get('categoryId') ?? '')
  if (!id) return
  if (await categoryHasScores(id)) return
  // Blokir bila masih ada juri yang ditugaskan ke kategori ini.
  const judges = await prisma.judge.count({ where: { categoryId: id } })
  if (judges > 0) return
  await prisma.category.delete({ where: { id } })
  revalidatePath('/admin/rubrik')
}

// ---- Grup -----------------------------------------------------------------

const groupSchema = z.object({
  categoryId: z.string().min(1),
  code: z.string().trim().max(20).optional(),
  name: z.string().trim().min(1).max(120),
})

export async function addGroupAction(_prev: RubricState, formData: FormData): Promise<RubricState> {
  try {
    await requireMinRole('SUPER_ADMIN')
  } catch (e) {
    return forbid(e)
  }

  const parsed = groupSchema.safeParse({
    categoryId: formData.get('categoryId'),
    code: formData.get('code') ?? undefined,
    name: formData.get('name'),
  })
  if (!parsed.success) return { error: 'Nama grup wajib diisi.' }

  if (await categoryHasScores(parsed.data.categoryId)) {
    return { error: 'Struktur tidak bisa diubah karena kategori sudah memiliki nilai.' }
  }

  const last = await prisma.criterionGroup.findFirst({
    where: { categoryId: parsed.data.categoryId },
    orderBy: { order: 'desc' },
  })

  await prisma.criterionGroup.create({
    data: {
      categoryId: parsed.data.categoryId,
      code: parsed.data.code || null,
      name: parsed.data.name,
      order: (last?.order ?? -1) + 1,
    },
  })

  revalidatePath(`/admin/rubrik/${parsed.data.categoryId}`)
  return { ok: true }
}

const groupUpdateSchema = z.object({
  groupId: z.string().min(1),
  code: z.string().trim().max(20).optional(),
  name: z.string().trim().min(1).max(120),
})

export async function updateGroupAction(_prev: RubricState, formData: FormData): Promise<RubricState> {
  try {
    await requireMinRole('SUPER_ADMIN')
  } catch (e) {
    return forbid(e)
  }

  const parsed = groupUpdateSchema.safeParse({
    groupId: formData.get('groupId'),
    code: formData.get('code') ?? undefined,
    name: formData.get('name'),
  })
  if (!parsed.success) return { error: 'Nama grup wajib diisi.' }

  const group = await prisma.criterionGroup.update({
    where: { id: parsed.data.groupId },
    data: { code: parsed.data.code || null, name: parsed.data.name },
  })

  revalidatePath(`/admin/rubrik/${group.categoryId}`)
  return { ok: true }
}

export async function deleteGroupAction(formData: FormData) {
  await requireMinRole('SUPER_ADMIN')
  const id = String(formData.get('groupId') ?? '')
  if (!id) return
  const group = await prisma.criterionGroup.findUnique({ where: { id } })
  if (!group) return
  if (await categoryHasScores(group.categoryId)) return
  await prisma.$transaction(async (tx) => {
    await tx.criterionGroup.delete({ where: { id } })
    await recomputeCategory(tx, group.categoryId)
  })
  revalidatePath(`/admin/rubrik/${group.categoryId}`)
}

// ---- Butir ----------------------------------------------------------------

const criterionSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  options: z.string(),
})

export async function addCriterionAction(_prev: RubricState, formData: FormData): Promise<RubricState> {
  try {
    await requireMinRole('SUPER_ADMIN')
  } catch (e) {
    return forbid(e)
  }

  const parsed = criterionSchema.safeParse({
    groupId: formData.get('groupId'),
    name: formData.get('name'),
    options: formData.get('options') ?? '',
  })
  if (!parsed.success) return { error: 'Nama butir wajib diisi.' }

  const { values, error } = parseOptions(parsed.data.options)
  if (error || !values) return { error }

  const group = await prisma.criterionGroup.findUnique({ where: { id: parsed.data.groupId } })
  if (!group) return { error: 'Grup tidak dikenal.' }
  if (await categoryHasScores(group.categoryId)) {
    return { error: 'Struktur tidak bisa diubah karena kategori sudah memiliki nilai.' }
  }

  const last = await prisma.criterion.findFirst({
    where: { groupId: group.id },
    orderBy: { order: 'desc' },
  })

  await prisma.$transaction(async (tx) => {
    await tx.criterion.create({
      data: {
        groupId: group.id,
        name: parsed.data.name,
        order: (last?.order ?? -1) + 1,
        options: values,
      },
    })
    await recomputeCategory(tx, group.categoryId)
  })

  revalidatePath(`/admin/rubrik/${group.categoryId}`)
  return { ok: true }
}

const criterionUpdateSchema = z.object({
  criterionId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  options: z.string(),
})

export async function updateCriterionAction(_prev: RubricState, formData: FormData): Promise<RubricState> {
  try {
    await requireMinRole('SUPER_ADMIN')
  } catch (e) {
    return forbid(e)
  }

  const parsed = criterionUpdateSchema.safeParse({
    criterionId: formData.get('criterionId'),
    name: formData.get('name'),
    options: formData.get('options') ?? '',
  })
  if (!parsed.success) return { error: 'Nama butir wajib diisi.' }

  const { values, error } = parseOptions(parsed.data.options)
  if (error || !values) return { error }

  const criterion = await prisma.criterion.findUnique({
    where: { id: parsed.data.criterionId },
    include: { group: true },
  })
  if (!criterion) return { error: 'Butir tidak dikenal.' }

  const locked = await categoryHasScores(criterion.group.categoryId)
  const sameOptions =
    values.length === criterion.options.length && values.every((v, i) => v === criterion.options[i])
  // Saat sudah ada nilai, hanya penggantian nama yang aman; opsi tidak boleh berubah.
  if (locked && !sameOptions) {
    return { error: 'Pilihan nilai tidak bisa diubah karena kategori sudah memiliki nilai.' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.criterion.update({
      where: { id: criterion.id },
      data: { name: parsed.data.name, options: values },
    })
    if (!sameOptions) await recomputeCategory(tx, criterion.group.categoryId)
  })

  revalidatePath(`/admin/rubrik/${criterion.group.categoryId}`)
  return { ok: true }
}

export async function deleteCriterionAction(formData: FormData) {
  await requireMinRole('SUPER_ADMIN')
  const id = String(formData.get('criterionId') ?? '')
  if (!id) return
  const criterion = await prisma.criterion.findUnique({
    where: { id },
    include: { group: true },
  })
  if (!criterion) return
  if (await categoryHasScores(criterion.group.categoryId)) return
  await prisma.$transaction(async (tx) => {
    await tx.criterion.delete({ where: { id } })
    await recomputeCategory(tx, criterion.group.categoryId)
  })
  revalidatePath(`/admin/rubrik/${criterion.group.categoryId}`)
}

// ---- Urutan (naik/turun) --------------------------------------------------

async function swapOrder(
  kind: 'category' | 'group' | 'criterion',
  id: string,
  dir: 'up' | 'down',
) {
  await requireMinRole('SUPER_ADMIN')

  if (kind === 'category') {
    const event = await currentEvent()
    const item = await prisma.category.findFirst({ where: { id, eventId: event.id } })
    if (!item) return
    const neighbor = await prisma.category.findFirst({
      where: {
        eventId: event.id,
        order: dir === 'up' ? { lt: item.order } : { gt: item.order },
      },
      orderBy: { order: dir === 'up' ? 'desc' : 'asc' },
    })
    if (!neighbor) return
    await prisma.$transaction([
      prisma.category.update({ where: { id: item.id }, data: { order: neighbor.order } }),
      prisma.category.update({ where: { id: neighbor.id }, data: { order: item.order } }),
    ])
    revalidatePath('/admin/rubrik')
    return
  }

  if (kind === 'group') {
    const item = await prisma.criterionGroup.findUnique({ where: { id } })
    if (!item) return
    const neighbor = await prisma.criterionGroup.findFirst({
      where: {
        categoryId: item.categoryId,
        order: dir === 'up' ? { lt: item.order } : { gt: item.order },
      },
      orderBy: { order: dir === 'up' ? 'desc' : 'asc' },
    })
    if (!neighbor) return
    await prisma.$transaction([
      prisma.criterionGroup.update({ where: { id: item.id }, data: { order: neighbor.order } }),
      prisma.criterionGroup.update({ where: { id: neighbor.id }, data: { order: item.order } }),
    ])
    revalidatePath(`/admin/rubrik/${item.categoryId}`)
    return
  }

  const item = await prisma.criterion.findUnique({ where: { id }, include: { group: true } })
  if (!item) return
  const neighbor = await prisma.criterion.findFirst({
    where: {
      groupId: item.groupId,
      order: dir === 'up' ? { lt: item.order } : { gt: item.order },
    },
    orderBy: { order: dir === 'up' ? 'desc' : 'asc' },
  })
  if (!neighbor) return
  // Pakai order sementara -1 agar tak melanggar unique([groupId, order]) saat menukar.
  await prisma.$transaction([
    prisma.criterion.update({ where: { id: item.id }, data: { order: -1 } }),
    prisma.criterion.update({ where: { id: neighbor.id }, data: { order: item.order } }),
    prisma.criterion.update({ where: { id: item.id }, data: { order: neighbor.order } }),
  ])
  revalidatePath(`/admin/rubrik/${item.group.categoryId}`)
}

export async function moveCategoryAction(formData: FormData) {
  await swapOrder('category', String(formData.get('id') ?? ''), formData.get('dir') === 'up' ? 'up' : 'down')
}

export async function moveGroupAction(formData: FormData) {
  await swapOrder('group', String(formData.get('id') ?? ''), formData.get('dir') === 'up' ? 'up' : 'down')
}

export async function moveCriterionAction(formData: FormData) {
  await swapOrder('criterion', String(formData.get('id') ?? ''), formData.get('dir') === 'up' ? 'up' : 'down')
}
