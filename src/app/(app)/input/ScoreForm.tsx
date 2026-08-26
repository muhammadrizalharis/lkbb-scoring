'use client'

import { useActionState, useMemo, useState } from 'react'
import { saveSheetAction, type SaveState } from './actions'

export type FormCriterion = { id: string; name: string; order: number; options: number[] }
export type FormGroup = { id: string; code: string | null; name: string; criteria: FormCriterion[] }

type Props = {
  teamId: string
  judgeId: string
  groups: FormGroup[]
  initialValues: Record<string, number>
  status: 'DRAFT' | 'FINAL' | null
  maxScore: number
}

const initialState: SaveState = {}

export function ScoreForm({ teamId, judgeId, groups, initialValues, status, maxScore }: Props) {
  const [values, setValues] = useState<Record<string, number>>(initialValues)
  const [state, formAction, pending] = useActionState(saveSheetAction, initialState)

  const criteria = useMemo(() => groups.flatMap((g) => g.criteria), [groups])
  const total = useMemo(() => Object.values(values).reduce((a, b) => a + b, 0), [values])
  const filled = Object.keys(values).length
  const missing = criteria.length - filled

  return (
    <form action={formAction} className="space-y-5 pb-28">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="judgeId" value={judgeId} />
      {Object.entries(values).map(([id, value]) => (
        <input key={id} type="hidden" name={`c:${id}`} value={value} />
      ))}

      {groups.map((group) => (
        <section key={group.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <h2 className="bg-slate-800 px-4 py-2 text-sm font-semibold tracking-wide text-white uppercase">
            {group.code ? `${group.code}. ` : ''}
            {group.name}
          </h2>
          <ul className="divide-y divide-slate-100">
            {group.criteria.map((criterion, index) => {
              const selected = values[criterion.id]
              return (
                <li key={criterion.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="w-6 shrink-0 text-sm text-slate-400 tabular-nums">{index + 1}</span>
                  <span className="min-w-56 flex-1 text-sm">{criterion.name}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {criterion.options.map((option) => {
                      const active = selected === option
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setValues((prev) => {
                              const next = { ...prev }
                              // Klik ulang pada nilai yang sama membatalkan pilihan.
                              if (prev[criterion.id] === option) delete next[criterion.id]
                              else next[criterion.id] = option
                              return next
                            })
                          }
                          className={`h-10 w-12 rounded-lg text-sm font-semibold tabular-nums transition ${
                            active
                              ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-1'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <p className="text-2xl font-bold tabular-nums">
              {total}
              <span className="ml-1 text-sm font-normal text-slate-500">/ {maxScore}</span>
            </p>
            <p className="text-xs text-slate-500">
              {filled} dari {criteria.length} butir terisi
              {missing > 0 && ` · ${missing} belum diisi`}
              {status === 'FINAL' && ' · sudah difinalkan'}
            </p>
          </div>

          {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
          {state.ok && !state.error && <p className="text-sm font-medium text-emerald-600">Tersimpan.</p>}

          <button
            type="submit"
            name="finalize"
            value="0"
            disabled={pending}
            className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold transition hover:bg-slate-100 disabled:opacity-50"
          >
            Simpan draf
          </button>
          <button
            type="submit"
            name="finalize"
            value="1"
            disabled={pending || missing > 0}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            {pending ? 'Menyimpan…' : 'Simpan & Finalkan'}
          </button>
        </div>
      </div>
    </form>
  )
}
