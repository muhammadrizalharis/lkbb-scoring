'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addPenaltyAction, type PenaltyState } from './actions'

type Option = { id: string; label: string }

export function PenaltyForm({ teams, categories }: { teams: Option[]; categories: Option[] }) {
  const [state, formAction, pending] = useActionState<PenaltyState, FormData>(addPenaltyAction, {})
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) ref.current?.reset()
  }, [state])

  return (
    <form ref={ref} action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-sm font-medium">Tim</span>
          <select
            name="teamId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
          >
            <option value="" disabled>
              Pilih tim…
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-sm font-medium">Kategori</span>
          <select
            name="categoryId"
            defaultValue=""
            className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
          >
            <option value="">Keseluruhan (kurangi total)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 sm:col-span-1">
          <span className="block text-sm font-medium">Poin pengurangan</span>
          <input
            type="number"
            name="points"
            min={1}
            required
            placeholder="mis. 5"
            className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>

        <label className="space-y-1 sm:col-span-1">
          <span className="block text-sm font-medium">Alasan</span>
          <input
            name="reason"
            required
            maxLength={200}
            placeholder="mis. Melebihi batas waktu"
            className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-red-700 ring-1 ring-danger/30 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.ok && !state.error && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
          Pengurangan nilai tersimpan.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-red-600/25 transition hover:opacity-95 disabled:opacity-50"
      >
        {pending ? 'Menyimpan…' : 'Tambah pengurangan'}
      </button>
    </form>
  )
}
