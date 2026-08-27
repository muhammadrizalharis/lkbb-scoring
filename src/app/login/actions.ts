'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createSession, destroySession, throttleLogin, verifyCredentials } from '@/lib/auth'
import type { Role } from '@/lib/auth'

export type LoginState = { error?: string }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!username || !password) return { error: 'Nama pengguna dan kata sandi wajib diisi.' }

  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() || 'lokal'
  if (!throttleLogin(`ip:${ip}`, 30, 5 * 60_000)) {
    return { error: 'Terlalu banyak percobaan dari jaringan ini. Coba lagi beberapa menit lagi.' }
  }
  if (!throttleLogin(`user:${username}`)) {
    return { error: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' }
  }

  const user = await verifyCredentials(username, password)
  if (!user) return { error: 'Nama pengguna atau kata sandi salah.' }

  await createSession({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role as Role,
  })
  redirect('/beranda')
}

export async function logoutAction() {
  await destroySession()
  redirect('/')
}
