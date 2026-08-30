'use client'

import { useActionState } from 'react'
import { setPublishedAction, type PublishState } from './actions'

/** Tombol publish/unpublish + peringatan bila lomba belum di-Live-kan. */
export function PublishButton({ published }: { published: boolean }) {
  const [state, action, pending] = useActionState<PublishState, FormData>(setPublishedAction, {})

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <form action={action}>
        <input type="hidden" name="published" value={published ? '0' : '1'} />
        <button
          disabled={pending}
          className={`w-full rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 sm:w-auto ${
            published
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-600/25'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-600/25'
          }`}
        >
          {pending ? 'Memproses…' : published ? 'Batalkan publish' : 'Publish untuk lomba'}
        </button>
      </form>
      {state.error && (
        <p className="max-w-xs rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
          {state.error}
        </p>
      )}
    </div>
  )
}
