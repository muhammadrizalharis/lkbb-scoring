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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/live" className="flex items-center gap-2.5">
          <Image src="/logo-mark.png" alt="Paskitactical" width={596} height={414} priority className="h-9 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">Paskitactical</span>
            <span className="text-[11px] font-medium text-muted-foreground">Skor Langsung</span>
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2 font-semibold">
            {liveMode && (
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-600" />
              </span>
            )}
            {liveMode && <span className="text-sm font-bold tracking-wide text-red-600 dark:text-red-400">LIVE</span>}
            <span className="break-words leading-tight">{name}</span>
          </span>
          {host && <span className="text-xs text-muted-foreground">{host}</span>}
        </div>

        <OrientationToggle />

        {backHref && (
          <Link href={backHref} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent">
            ← Kembali
          </Link>
        )}
      </div>
    </header>
  )
}
