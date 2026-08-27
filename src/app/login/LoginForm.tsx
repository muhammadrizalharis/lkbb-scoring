'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction, type LoginState } from './actions'

const initial: LoginState = {}

type Variant = 'admin' | 'operator' | 'staff'

const COPY: Record<Variant, { badge: string; title: string; subtitle: string; accent: string }> = {
  admin: {
    badge: 'Super Admin / Admin',
    title: 'Panel Pengelola',
    subtitle: 'Masuk untuk mengatur lomba, rubrik, akun, dan penilaian.',
    accent: 'from-primary to-blue-500',
  },
  operator: {
    badge: 'Operator',
    title: 'Panel Operator',
    subtitle: 'Masuk untuk memasukkan nilai peserta.',
    accent: 'from-emerald-500 to-teal-500',
  },
  staff: {
    badge: 'Petugas',
    title: 'Paskitactical',
    subtitle: 'Masuk untuk memasukkan atau melihat nilai.',
    accent: 'from-primary to-blue-500',
  },
}

export function LoginForm({ variant = 'staff' }: { variant?: Variant }) {
  const [state, formAction, pending] = useActionState(loginAction, initial)
  const copy = COPY[variant]

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      {/* Latar dekoratif */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <form
        action={formAction}
        className="w-full max-w-sm space-y-6 rounded-3xl bg-card/80 p-8 shadow-2xl shadow-primary/10 ring-1 ring-border backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo-mark.png"
            alt="Paskitactical"
            width={596}
            height={414}
            priority
            className="mb-3 h-20 w-auto drop-shadow"
          />
          <span className={`mb-2 rounded-full bg-gradient-to-br ${copy.accent} px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow`}>
            {copy.badge}
          </span>
          <h1 className="text-xl font-bold tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Nama pengguna</span>
          <input
            name="username"
            autoComplete="username"
            autoFocus
            required
            className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-2.5 outline-none transition focus:border-ring focus:ring-4 focus:ring-primary/15"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Kata sandi</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-2.5 outline-none transition focus:border-ring focus:ring-4 focus:ring-primary/15"
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-red-700 ring-1 ring-danger/30 dark:text-red-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`w-full rounded-xl bg-gradient-to-br ${copy.accent} py-2.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95 disabled:opacity-50`}
        >
          {pending ? 'Memproses…' : 'Masuk'}
        </button>

        <div className="flex items-center justify-between text-xs">
          <Link href="/" className="font-medium text-muted-foreground transition hover:text-foreground">
            ← Kembali
          </Link>
          <Link href="/live" className="font-semibold text-primary transition hover:underline dark:text-blue-300">
            Lihat skor langsung →
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Developed by{' '}
          <a
            href="https://www.instagram.com/mhmmddrizal/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline dark:text-blue-300"
          >
            Muhammad Rizal Haris
          </a>
        </p>
      </form>
    </main>
  )
}
