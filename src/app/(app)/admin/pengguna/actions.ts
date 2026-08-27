'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireMinRole } from '@/lib/auth'

export type UserState = { ok?: boolean; error?: string; message?: string }

const addSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._]{3,30}$/, 'Username 3-30 karakter: huruf kecil, angka, titik, garis bawah.'),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.').max(200),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
})

export async function addUserAction(_prev: UserState, formData: FormData): Promise<UserState> {
  let session
  try {
    session = await requireMinRole('SUPER_ADMIN')
  } catch {
    return { error: 'Hanya Super Admin yang boleh mengelola akun.' }
  }

  const parsed = addSchema.safeParse({
    username: formData.get('username'),
    name: formData.get('name'),
    password: formData.get('password'),
    role: formData.get('role'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }

  const exists = await prisma.user.findUnique({ where: { username: parsed.data.username } })
  if (exists) return { error: `Username "${parsed.data.username}" sudah dipakai.` }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
    },
  })
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'ADD_USER',
      entity: 'User',
      entityId: user.id,
      detail: { username: user.username, role: user.role },
    },
  })

  revalidatePath('/admin/pengguna')
  return { ok: true, message: `Akun "${user.username}" (${user.role.toLowerCase()}) dibuat.` }
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireMinRole('SUPER_ADMIN')
  const id = String(formData.get('id') ?? '')
  if (!id || id === session.userId) return // tak boleh hapus diri sendiri

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return
  if (target.role === 'SUPER_ADMIN') {
    const supers = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } })
    if (supers <= 1) return // jangan hapus super admin terakhir
  }

  await prisma.user.delete({ where: { id } })
  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'DELETE_USER', entity: 'User', entityId: id },
  })
  revalidatePath('/admin/pengguna')
}

const resetSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.').max(200),
})

export async function resetPasswordAction(_prev: UserState, formData: FormData): Promise<UserState> {
  let session
  try {
    session = await requireMinRole('SUPER_ADMIN')
  } catch {
    return { error: 'Hanya Super Admin yang boleh mengelola akun.' }
  }

  const parsed = resetSchema.safeParse({ id: formData.get('id'), password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.id } })
  if (!target) return { error: 'Akun tidak ditemukan.' }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash } })
  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'RESET_PASSWORD', entity: 'User', entityId: target.id },
  })

  revalidatePath('/admin/pengguna')
  return { ok: true, message: `Kata sandi "${target.username}" diperbarui.` }
}
