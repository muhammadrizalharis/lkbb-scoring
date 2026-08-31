import Image from 'next/image'
import Link from 'next/link'
import { OrientationToggle } from './OrientationToggle'

export function PublicHeader({
  name,
  host,
  liveMode,
  backHref,
}: {
  name: string
  host: string | null
  liveMode: boolean
  backHref?: string
}) {
  return (
    <header className="border-b border-border/80 bg-card/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
        <Link href="/live" className="flex shrink-0 items-center gap-2.5">
          <Image src="/logo-mark.png" alt="Paskitactical" width={596} height={414} priority className="h-8 w-auto sm:h-9" />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-bold tracking-tight">Paskitactical</span>
            <span className="text-[11px] font-medium text-muted-foreground">Skor Langsung</span>
          </span>
        </Link>

        <div className="order-last flex w-full min-w-0 flex-col sm:order-none sm:w-auto sm:flex-1">
          <span className="flex items-center gap-2 font-semibold leading-tight">
            {liveMode && (
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-600" />
              </span>
            )}
            {liveMode && <span className="text-sm font-bold tracking-wide text-red-600 dark:text-red-400">LIVE</span>}
            <span className="break-words">{name}</span>
          </span>
          {host && <span className="text-xs text-muted-foreground">{host}</span>}
        </div>

        <OrientationToggle />

        {backHref && (
          <Link href={backHref} className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent">
            ← Kembali
          </Link>
        )}
      </div>
    </header>
  )
}
