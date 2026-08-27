'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from './actions'

const initial: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial)

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
          <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-7"
            >
              <path d="M8 21h8M12 17v4M6 4h12l-1 8a5 5 0 0 1-10 0L6 4z" />
              <path d="M6 8H4a2 2 0 0 0 0 4h1.5M18 8h2a2 2 0 0 1 0 4h-1.5" />
            </svg>
          </span>
          <h1 className="text-xl font-bold tracking-tight">Paskitactical</h1>
          <p className="mt-1 text-sm text-muted-foreground">Masuk untuk memasukkan atau melihat nilai.</p>
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
          className="w-full rounded-xl bg-gradient-to-br from-primary to-blue-500 py-2.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95 hover:shadow-primary/40 disabled:opacity-50"
        >
          {pending ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}
