import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { EVENT_SLUG } from '@/lib/config'
import { ThemeToggle } from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

const FEATURES = [
  {
    title: 'Input nilai per juri',
    desc: 'Setiap juri mengisi nilai tiap butir sesuai rubrik, lengkap dengan catatan bila perlu.',
    icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
  },
  {
    title: 'Rekap & Juara Umum otomatis',
    desc: 'Total, peringkat kategori, dan Juara Umum dihitung otomatis begitu lembar nilai disimpan.',
    icon: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  },
  {
    title: 'Live score publik',
    desc: 'Penonton memantau peringkat sementara yang diperbarui otomatis setiap 15 detik.',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
  },
  {
    title: 'Nilai transparan',
    desc: 'Peserta dapat melihat rincian nilai asli setiap butir dari tiap juri.',
    icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  },
]

export default async function LandingPage() {
  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    select: { name: true, host: true, liveMode: true },
  })

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      {/* Latar dekoratif */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-mark.png" alt="Paskitactical" width={596} height={414} priority className="h-9 w-auto" />
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-bold tracking-tight">Paskitactical</span>
              <span className="text-[11px] font-medium text-muted-foreground">Penilaian &amp; Rekap Lomba</span>
            </span>
          </Link>
          <div className="flex flex-1 items-center justify-end gap-3">
            <Link
              href="/live"
              className="whitespace-nowrap rounded-lg bg-gradient-to-br from-primary to-blue-500 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95"
            >
              Lihat Live Score
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:py-16">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          {event?.liveMode ? (
            <Link
              href="/live"
              className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-500/15 dark:text-red-400"
            >
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-600" />
              </span>
              LIVE — {event.name} sedang berlangsung
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
              Sistem Penilaian & Rekapitulasi Lomba
            </span>
          )}

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Rekap nilai lomba jadi{' '}
            <span className="bg-gradient-to-br from-primary to-blue-500 bg-clip-text text-transparent">cepat &amp; transparan</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Paskitactical membantu panitia menghitung nilai lomba apa pun yang bernilai angka — dari input juri per butir hingga penentuan Juara Umum — secara otomatis dan real-time.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/live"
              className="rounded-xl bg-gradient-to-br from-primary to-blue-500 px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95"
            >
              Lihat Live Score →
            </Link>
          </div>
          {event?.host && <p className="mt-4 text-sm text-muted-foreground">Penyelenggara: {event.host}</p>}
        </section>

        {/* Fitur */}
        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-card/70 p-5 shadow-sm ring-1 ring-border backdrop-blur">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-transparent text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d={f.icon} />
                </svg>
              </span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Ajakan menonton */}
        <section className="mt-16 rounded-3xl bg-gradient-to-br from-primary/10 to-blue-500/5 p-8 text-center ring-1 ring-border sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight">Sedang menonton lomba?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Pantau peringkat sementara, skor tiap kategori, dan rincian nilai setiap peserta langsung dari ponsel Anda.
          </p>
          <Link
            href="/live"
            className="mt-6 inline-block rounded-xl bg-gradient-to-br from-primary to-blue-500 px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95"
          >
            Buka Live Score
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
          Developed by{' '}
          <a href="https://www.instagram.com/mhmmddrizal/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline dark:text-blue-300">
            Muhammad Rizal Haris
          </a>
        </div>
      </footer>
    </div>
  )
}
