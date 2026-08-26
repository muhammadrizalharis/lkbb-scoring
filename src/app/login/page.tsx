'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from './actions'

const initial: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial)

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200"
      >
        <div>
          <h1 className="text-xl font-bold">Rekapitulasi Nilai LKBB</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk untuk memasukkan atau melihat nilai.</p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Nama pengguna</span>
          <input
            name="username"
            autoComplete="username"
            autoFocus
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Kata sandi</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}
