'use client'

import { useActionState } from 'react'
import type { AdminState } from './actions'

type Action = (state: AdminState, formData: FormData) => Promise<AdminState>

export function AdminForm({
  action,
  submitLabel,
  children,
}: {
  action: Action
  submitLabel: string
  children: React.ReactNode
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(action, {})

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && !state.error && <p className="text-sm text-emerald-600">Tersimpan.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? 'Menyimpan…' : submitLabel}
      </button>
    </form>
  )
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium">{label}</span>
      <input
        {...props}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
      />
    </label>
  )
}
