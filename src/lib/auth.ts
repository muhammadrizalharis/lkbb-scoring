import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

const COOKIE = 'lkbb_session'
const MAX_AGE = 60 * 60 * 12

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER'
export type Session = { userId: string; username: string; name: string; role: Role }

/** Peringkat peran; makin tinggi makin luas kewenangannya. */
const ROLE_RANK: Record<Role, number> = { VIEWER: 0, OPERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 }

export function hasAtLeast(role: Role, min: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[min]
}

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw new Error('AUTH_SECRET belum diset')
  return new TextEncoder().encode(value)
}

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())

  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    return {
      userId: String(payload.userId),
      username: String(payload.username),
      name: String(payload.name),
      role: payload.role as Role,
    }
  } catch {
    return null
  }
}

/** Melempar jika belum login; dipakai di setiap server action & halaman terproteksi. */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireSession()
  if (!roles.includes(session.role)) throw new Error('FORBIDDEN')
  return session
}

/** Lolos bila peran pengguna setara atau lebih tinggi dari `min`. */
export async function requireMinRole(min: Role): Promise<Session> {
  const session = await requireSession()
  if (!hasAtLeast(session.role, min)) throw new Error('FORBIDDEN')
  return session
}

const attempts = new Map<string, { count: number; resetAt: number }>()

/** Pembatas percobaan login sederhana (per proses) untuk meredam brute force. */
export function throttleLogin(key: string, limit = 8, windowMs = 5 * 60_000) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

export async function verifyCredentials(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } })
  // Tetap jalankan bcrypt saat user tidak ada agar waktu respons seragam.
  const hash = user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin'
  const ok = await bcrypt.compare(password, hash)
  if (!user || !ok) return null
  return user
}
