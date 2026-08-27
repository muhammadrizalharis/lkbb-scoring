'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent print:hidden"
    >
      Cetak / Simpan PDF
    </button>
  )
}
