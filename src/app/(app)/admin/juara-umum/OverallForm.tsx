'use client'

import { useActionState } from 'react'
import { updateOverallConfigAction } from '../actions'
import type { AdminState } from '../actions'

type Props = {
  overallMethod: string
  goldPoints: number
  silverPoints: number
  bronzePoints: number
  medalPlaces: number
}

export function OverallForm(props: Props) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(updateOverallConfigAction, {})
  const isMedal = props.overallMethod !== 'TOTAL_SCORE'

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Metode perhitungan</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input type="radio" name="overallMethod" value="MEDAL_POINTS" defaultChecked={isMedal} className="mt-1 size-4" />
          <span>
            <span className="font-medium">Sistem poin medali</span>
            <span className="block text-sm text-muted-foreground">
              Tiap kategori menghasilkan emas/perak/perunggu. Poin dijumlah; poin terbanyak = Juara Umum.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input type="radio" name="overallMethod" value="TOTAL_SCORE" defaultChecked={!isMedal} className="mt-1 size-4" />
          <span>
            <span className="font-medium">Akumulasi nilai</span>
            <span className="block text-sm text-muted-foreground">
              Jumlah nilai semua kategori (× bobot) dikurangi penalti. Total tertinggi = Juara Umum.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Poin medali &amp; jumlah medali per kategori</legend>
        <div className="flex flex-wrap gap-3">
          <Num label="Poin Emas 🥇" name="goldPoints" value={props.goldPoints} />
          <Num label="Poin Perak 🥈" name="silverPoints" value={props.silverPoints} />
          <Num label="Poin Perunggu 🥉" name="bronzePoints" value={props.bronzePoints} />
          <Num label="Medali per kategori" name="medalPlaces" value={props.medalPlaces} min={1} max={3} />
        </div>
        <p className="text-xs text-muted-foreground">
          Medali per kategori: 3 = emas, perak, perunggu; 2 = emas, perak; 1 = emas saja. Hanya
          dipakai pada metode poin medali.
        </p>
      </fieldset>

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
        {pending ? 'Menyimpan…' : 'Simpan pengaturan'}
      </button>
    </form>
  )
}

function Num({
  label,
  name,
  value,
  min = 0,
  max = 1000,
}: {
  label: string
  name: string
  value: number
  min?: number
  max?: number
}) {
  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={value}
        min={min}
        max={max}
        required
        className="w-40 rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-ring"
      />
    </label>
  )
}
