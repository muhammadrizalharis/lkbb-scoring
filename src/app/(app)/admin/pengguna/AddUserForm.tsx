'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addUserAction, type UserState } from './actions'

export function AddUserForm() {
  const [state, formAction, pending] = useActionState<UserState, FormData>(addUserAction, {})
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) ref.current?.reset()
  }, [state])

  return (
    <form ref={ref} action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-sm font-medium">Username</span>
          <input
            name="username"
            required
            autoComplete="off"
            placeholder="mis. operator1"
            className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Nama lengkap</span>
          <input
            name="name"
            required
            placeholder="mis. Andi (Meja PBB)"
            className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Kata sandi</span>
          <input
            name="password"
            type="text"
            required
            minLength={6}
            placeholder="minimal 6 karakter"
            autoComplete="off"
            className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Peran</span>
          <select
            name="role"
            defaultValue="OPERATOR"
            className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
          >
            <option value="OPERATOR">Operator (input nilai)</option>
            <option value="VIEWER">Viewer (hanya lihat)</option>
            <option value="ADMIN">Admin (kelola tim/juri/bobot)</option>
          </select>
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-red-700 ring-1 ring-danger/30 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-br from-primary to-blue-500 px-5 py-2.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95 disabled:opacity-50"
      >
        {pending ? 'Menyimpan…' : 'Tambah akun'}
      </button>
      <p className="text-xs text-muted-foreground">
        Kata sandi sengaja terlihat agar mudah dicatat lalu diberikan ke operator. Semua akun memakai
        database yang sama, jadi status input tersinkron otomatis.
      </p>
    </form>
  )
}
