'use client'

import { useActionState, useEffect, useRef } from 'react'
import type { RubricState } from './actions'

type Action = (state: RubricState, formData: FormData) => Promise<RubricState>

/** Form tambah/simpan yang menampilkan status dan mengosongkan input setelah sukses. */
export function RubricForm({
  action,
  submitLabel,
  children,
  clearOnSuccess = true,
  className,
}: {
  action: Action
  submitLabel: string
  children: React.ReactNode
  clearOnSuccess?: boolean
  className?: string
}) {
  const [state, formAction, pending] = useActionState<RubricState, FormData>(action, {})
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok && clearOnSuccess) ref.current?.reset()
  }, [state, clearOnSuccess])

  return (
    <form ref={ref} action={formAction} className={className ?? 'space-y-3'}>
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
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
      />
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}
