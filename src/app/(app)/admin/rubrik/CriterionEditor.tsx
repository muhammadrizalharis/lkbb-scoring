'use client'

import { useActionState, useState } from 'react'
import {
  updateCriterionAction,
  deleteCriterionAction,
  moveCriterionAction,
  type RubricState,
} from './actions'

export type EditableCriterion = {
  id: string
  name: string
  order: number
  options: number[]
}

export function CriterionEditor({
  criterion,
  index,
  isFirst,
  isLast,
  locked,
}: {
  criterion: EditableCriterion
  index: number
  isFirst: boolean
  isLast: boolean
  locked: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, pending] = useActionState<RubricState, FormData>(updateCriterionAction, {})

  // Tutup editor begitu penyimpanan berhasil (penyesuaian state saat render).
  const [seenState, setSeenState] = useState(state)
  if (state !== seenState) {
    setSeenState(state)
    if (state.ok) setEditing(false)
  }

  if (editing) {
    return (
      <li className="px-4 py-3">
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="criterionId" value={criterion.id} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1 space-y-1">
              <span className="block text-sm font-medium">Nama butir</span>
              <input
                name="name"
                defaultValue={criterion.name}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-sm font-medium">Pilihan nilai</span>
              <input
                name="options"
                defaultValue={criterion.options.join(', ')}
                disabled={locked}
                placeholder="6, 10, 14, 18"
                className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
              />
              {locked && <span className="block text-xs text-amber-600">terkunci (sudah ada nilai)</span>}
            </label>
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {pending ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100"
            >
              Batal
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="w-6 shrink-0 text-sm text-slate-400 tabular-nums">{index + 1}</span>
      <span className="min-w-48 flex-1 text-sm">{criterion.name}</span>
      <div className="flex flex-wrap gap-1">
        {criterion.options.map((o) => (
          <span key={o} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600">
            {o}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <form action={moveCriterionAction}>
          <input type="hidden" name="id" value={criterion.id} />
          <input type="hidden" name="dir" value="up" />
          <button
            disabled={isFirst}
            className="rounded px-2 py-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            title="Naik"
          >
            ▲
          </button>
        </form>
        <form action={moveCriterionAction}>
          <input type="hidden" name="id" value={criterion.id} />
          <input type="hidden" name="dir" value="down" />
          <button
            disabled={isLast}
            className="rounded px-2 py-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            title="Turun"
          >
            ▼
          </button>
        </form>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          Ubah
        </button>
        {!locked && (
          <form action={deleteCriterionAction}>
            <input type="hidden" name="criterionId" value={criterion.id} />
            <button className="rounded px-2 py-1 text-sm text-red-600 transition hover:bg-red-50">Hapus</button>
          </form>
        )}
      </div>
    </li>
  )
}
