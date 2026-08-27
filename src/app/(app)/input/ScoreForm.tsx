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
  initialNotes: Record<string, string>
  status: 'DRAFT' | 'FINAL' | null
  maxScore: number
  locked: boolean
  enteredBy: string | null
}

const initialState: SaveState = {}

export function ScoreForm({
  teamId,
  judgeId,
  groups,
  initialValues,
  initialNotes,
  status,
  maxScore,
  locked,
  enteredBy,
}: Props) {
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
        <section key={group.id} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
          <h2 className="bg-gradient-to-r from-primary to-blue-600 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-primary-foreground">
            {group.code ? `${group.code}. ` : ''}
            {group.name}
          </h2>
          <ul className="divide-y divide-border">
            {group.criteria.map((criterion, index) => {
              const selected = values[criterion.id]
              return (
                <li key={criterion.id} className="flex flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-accent/30">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-56 flex-1 text-sm">{criterion.name}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {criterion.options.map((option) => {
                      const active = selected === option
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={active}
                          disabled={locked}
                          onClick={() =>
                            setValues((prev) => {
                              const next = { ...prev }
                              // Klik ulang pada nilai yang sama membatalkan pilihan.
                              if (prev[criterion.id] === option) delete next[criterion.id]
                              else next[criterion.id] = option
                              return next
                            })
                          }
                          className={`h-10 w-12 rounded-lg text-sm font-bold tabular-nums transition disabled:cursor-not-allowed disabled:hover:scale-100 ${
                            active
                              ? 'bg-gradient-to-br from-primary to-blue-500 text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-ring ring-offset-2 ring-offset-card'
                              : 'bg-muted text-foreground hover:bg-accent hover:scale-105 disabled:opacity-50'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    name={`n:${criterion.id}`}
                    defaultValue={initialNotes[criterion.id] ?? ''}
                    maxLength={500}
                    disabled={locked}
                    placeholder="Keterangan (opsional)…"
                    className="mt-1 w-full rounded-lg border border-input bg-background/40 px-3 py-1.5 text-xs outline-none focus:border-ring disabled:opacity-60"
                  />
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <p className="text-2xl font-black tabular-nums">
              {total}
              <span className="ml-1 text-sm font-normal text-muted-foreground">/ {maxScore}</span>
            </p>
            <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all"
                style={{ width: `${criteria.length ? (filled / criteria.length) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {filled} dari {criteria.length} butir terisi
              {missing > 0 && ` · ${missing} belum diisi`}
              {status === 'FINAL' && ' · sudah difinalkan'}
            </p>
          </div>

          {locked ? (
            <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              🔒 Terkunci — sudah difinalkan{enteredBy ? ` oleh ${enteredBy}` : ''}. Hubungi admin untuk koreksi.
            </p>
          ) : (
            <>
              {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
              {state.ok && !state.error && <p className="text-sm font-medium text-emerald-600">Tersimpan.</p>}

              <button
                type="submit"
                name="finalize"
                value="0"
                disabled={pending}
                className="rounded-xl border border-input bg-card px-4 py-2.5 font-semibold transition hover:bg-accent disabled:opacity-50"
              >
                Simpan draf
              </button>
              <button
                type="submit"
                name="finalize"
                value="1"
                disabled={pending || missing > 0}
                className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:opacity-95 disabled:opacity-40 disabled:shadow-none"
              >
                {pending ? 'Menyimpan…' : 'Simpan & Finalkan'}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
