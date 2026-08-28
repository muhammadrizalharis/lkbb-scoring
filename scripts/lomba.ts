/**
 * Alat developer untuk memulihkan DATA LOMBA (tim, juri, lembar nilai, butir, penalti)
 * dari cadangan otomatis yang dibuat SETIAP kali super admin menekan "Reset Data Lomba".
 * Karena cadangan disimpan di tabel EventDataSnapshot (independen, tanpa cascade), data
 * bisa dipulihkan walaupun tidak pernah di-backup ke file.
 *
 * Jalankan (dari ~/lkbb-scoring):
 *   npm run lomba -- list                 # daftar semua cadangan/snapshot
 *   npm run lomba -- restore latest       # pulihkan snapshot terbaru
 *   npm run lomba -- restore <snapshotId> # pulihkan snapshot tertentu
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL belum diset')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

type Row = Record<string, unknown>
type Payload = {
  teams: Row[]
  judges: Row[]
  sheets: Row[]
  items: Row[]
  penalties: Row[]
}

async function list() {
  const snaps = await prisma.eventDataSnapshot.findMany({ orderBy: { createdAt: 'desc' } })
  if (snaps.length === 0) {
    console.log('(belum ada snapshot — snapshot dibuat otomatis saat reset data lomba)')
    return
  }
  console.log(`Total ${snaps.length} snapshot (terbaru di atas):\n`)
  for (const s of snaps) {
    console.log(
      `- ${fmt.format(s.createdAt)}  tim:${s.teamCount} juri:${s.judgeCount} ` +
        `lembar:${s.sheetCount} butir:${s.itemCount} penalti:${s.penaltyCount}\n    id: ${s.id}`,
    )
  }
  console.log('\nPulihkan: npm run lomba -- restore latest   (atau restore <id>)')
}

/** Ubah field tanggal string (hasil JSON) kembali ke Date; sisanya dibiarkan. */
function withDates(row: Row, dateKeys: string[]): Row {
  const out: Row = { ...row }
  for (const k of dateKeys) {
    out[k] = out[k] ? new Date(out[k] as string) : null
  }
  return out
}

async function restore(key: string) {
  const snap =
    key === 'latest'
      ? await prisma.eventDataSnapshot.findFirst({ orderBy: { createdAt: 'desc' } })
      : await prisma.eventDataSnapshot.findUnique({ where: { id: key } })

  if (!snap) {
    console.error(key === 'latest' ? 'Belum ada snapshot untuk dipulihkan.' : `Snapshot "${key}" tidak ditemukan.`)
    process.exitCode = 1
    return
  }

  const p = snap.payload as unknown as Payload
  const eventId = snap.eventId

  const existing = await prisma.team.count({ where: { eventId } })
  if (existing > 0) {
    console.log(`Catatan: event ini sudah punya ${existing} tim. Baris yang bentrok akan dilewati (skipDuplicates).`)
  }

  // Urutan penting: tim & juri dulu (dirujuk lembar), lalu lembar, butir, penalti.
  const teams = await prisma.team.createMany({ data: p.teams as never, skipDuplicates: true })
  const judges = await prisma.judge.createMany({ data: p.judges as never, skipDuplicates: true })
  const sheets = await prisma.scoreSheet.createMany({
    data: p.sheets.map((s) => withDates(s, ['finalizedAt', 'createdAt', 'updatedAt'])) as never,
    skipDuplicates: true,
  })
  const items = await prisma.scoreItem.createMany({ data: p.items as never, skipDuplicates: true })
  const penalties = await prisma.penalty.createMany({
    data: p.penalties.map((pen) => withDates(pen, ['createdAt'])) as never,
    skipDuplicates: true,
  })

  console.log(`✔ Snapshot ${fmt.format(snap.createdAt)} dipulihkan:`)
  console.log(
    `  tim:${teams.count}/${p.teams.length}  juri:${judges.count}/${p.judges.length}  ` +
      `lembar:${sheets.count}/${p.sheets.length}  butir:${items.count}/${p.items.length}  ` +
      `penalti:${penalties.count}/${p.penalties.length}`,
  )
}

async function main() {
  const [cmd, arg] = process.argv.slice(2)
  switch (cmd) {
    case 'list':
      await list()
      break
    case 'restore':
      await restore(arg || 'latest')
      break
    default:
      console.log('Perintah: list | restore latest | restore <snapshotId>')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
