/**
 * Alat developer untuk mengelola akun langsung dari terminal — jalur darurat bila
 * UI tidak bisa diakses (mis. semua Super Admin ter-nonaktif). Karena penghapusan
 * akun bersifat *soft delete*, data akun yang "dihapus" TETAP ada di database dan
 * bisa dipulihkan kapan saja, walaupun tidak pernah di-backup.
 *
 * Jalankan (dari ~/lkbb-scoring):
 *   npm run users -- list                 # tampilkan semua akun (aktif + terhapus)
 *   npm run users -- restore <username>   # aktifkan kembali akun (bisa username atau id)
 *   npm run users -- restore-all          # aktifkan kembali SEMUA akun terhapus
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL belum diset')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

async function list() {
  const users = await prisma.user.findMany({ orderBy: [{ deletedAt: 'asc' }, { role: 'asc' }, { username: 'asc' }] })
  if (users.length === 0) {
    console.log('(tidak ada akun)')
    return
  }
  console.log(`Total ${users.length} akun:\n`)
  for (const u of users) {
    const status = u.deletedAt ? `TERHAPUS ${fmt.format(u.deletedAt)}` : 'aktif'
    console.log(`- ${u.username.padEnd(32)} ${u.role.padEnd(12)} ${status}   [${u.id}]`)
  }
}

async function restore(key: string) {
  const user = await prisma.user.findFirst({ where: { OR: [{ username: key.toLowerCase() }, { id: key }] } })
  if (!user) {
    console.error(`Akun "${key}" tidak ditemukan.`)
    process.exitCode = 1
    return
  }
  if (!user.deletedAt) {
    console.log(`Akun "${user.username}" sudah aktif, tidak ada yang perlu dipulihkan.`)
    return
  }
  await prisma.user.update({ where: { id: user.id }, data: { deletedAt: null } })
  console.log(`✔ Akun "${user.username}" (${user.role}) dipulihkan.`)
}

async function restoreAll() {
  const res = await prisma.user.updateMany({ where: { deletedAt: { not: null } }, data: { deletedAt: null } })
  console.log(`✔ ${res.count} akun terhapus dipulihkan.`)
}

async function main() {
  const [cmd, arg] = process.argv.slice(2)
  switch (cmd) {
    case 'list':
      await list()
      break
    case 'restore':
      if (!arg) {
        console.error('Pakai: npm run users -- restore <username|id>')
        process.exitCode = 1
        break
      }
      await restore(arg)
      break
    case 'restore-all':
      await restoreAll()
      break
    default:
      console.log('Perintah: list | restore <username|id> | restore-all')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
