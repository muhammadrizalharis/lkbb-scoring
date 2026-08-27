'use client'

import { useActionState, useState } from 'react'
import { resetPasswordAction, type UserState } from './actions'

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<UserState, FormData>(resetPasswordAction, {})

  // Tutup form begitu berhasil (penyesuaian state saat render, bukan di effect).
  const [seen, setSeen] = useState(state)
  if (state !== seen) {
    setSeen(state)
    if (state.ok) setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground transition hover:text-foreground hover:underline"
      >
        Ganti sandi
      </button>
    )
  }

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={userId} />
      <input
        name="password"
        type="text"
        required
        minLength={6}
        autoFocus
        placeholder="sandi baru"
        className="w-32 rounded-lg border border-input bg-background/50 px-2 py-1 text-sm outline-none focus:border-ring"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-2.5 py-1 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        Simpan
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:underline">
        Batal
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  )
}
