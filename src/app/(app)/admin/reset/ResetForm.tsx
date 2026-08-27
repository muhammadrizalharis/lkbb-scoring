'use client'

import { useActionState, useState } from 'react'
import { resetEventDataAction } from '../actions'
import type { AdminState } from '../actions'

export function ResetForm() {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(resetEventDataAction, {})
  const [confirm, setConfirm] = useState('')
  const armed = confirm.trim().toUpperCase() === 'HAPUS'

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">
          Ketik <span className="font-mono font-bold text-danger">HAPUS</span> untuk mengonfirmasi
        </span>
        <input
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          placeholder="HAPUS"
          className="w-full max-w-xs rounded-xl border border-input bg-background/50 px-3.5 py-2.5 font-mono outline-none transition focus:border-danger focus:ring-4 focus:ring-danger/15"
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-red-700 ring-1 ring-danger/30 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
          {state.message} Data lomba sudah bersih.
        </p>
      )}

      <button
        type="submit"
        disabled={!armed || pending}
        className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-red-600/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {pending ? 'Menghapus…' : 'Hapus semua data lomba'}
      </button>
    </form>
  )
}
