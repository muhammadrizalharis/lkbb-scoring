/**
 * Mengisi data contoh (tim, juri, nilai acak) untuk latihan panitia.
 * Jalankan: npm run demo -- --reset
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL belum diset')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const SLUG = process.env.SEED_EVENT_SLUG ?? 'lkbb-smantib'
const RESET = process.argv.includes('--reset')

const TEAMS = [
  'Paskibra SMAN 1 Tinambung',
  'Paskibra SMAN 2 Polewali',
  'Paskibra SMAN 3 Majene',
  'Paskibra SMKN 1 Wonomulyo',
  'Paskibra MAN 1 Mamuju',
]

async function main() {
  const event = await prisma.event.findUnique({
    where: { slug: SLUG },
    include: { categories: { orderBy: { order: 'asc' } } },
  })
  if (!event) throw new Error('Event belum di-seed')

  if (RESET) {
    await prisma.scoreSheet.deleteMany({ where: { eventId: event.id } })
    await prisma.judge.deleteMany({ where: { eventId: event.id } })
    await prisma.team.deleteMany({ where: { eventId: event.id } })
    console.log('  · data lomba lama dihapus')
  }

  for (const [i, name] of TEAMS.entries()) {
    await prisma.team.upsert({
      where: { eventId_number: { eventId: event.id, number: i + 1 } },
      update: { name },
      create: { eventId: event.id, number: i + 1, name },
    })
  }

  // Dua juri untuk PBB agar penjumlahan antar juri ikut teruji.
  const plan = event.categories.flatMap((c) =>
    (c.code === 'PBB' ? [1, 2] : [1]).map((n) => ({ category: c, code: `${c.code}-${n}` })),
  )
  for (const p of plan) {
    await prisma.judge.upsert({
      where: { eventId_code: { eventId: event.id, code: p.code } },
      update: {},
      create: { eventId: event.id, categoryId: p.category.id, code: p.code, name: `Juri ${p.code}` },
    })
  }

  const teams = await prisma.team.findMany({ where: { eventId: event.id } })
  const judges = await prisma.judge.findMany({ where: { eventId: event.id } })
  const criteriaByCategory = new Map<string, { id: string; options: number[] }[]>()
  for (const category of event.categories) {
    const groups = await prisma.criterionGroup.findMany({
      where: { categoryId: category.id },
      include: { criteria: true },
    })
    criteriaByCategory.set(category.id, groups.flatMap((g) => g.criteria))
  }

  let sheets = 0
  for (const team of teams) {
    for (const judge of judges) {
      const criteria = criteriaByCategory.get(judge.categoryId) ?? []
      const items = criteria.map((c) => ({
        criterionId: c.id,
        value: c.options[Math.floor(Math.random() * c.options.length)],
      }))
      const total = items.reduce((s, i) => s + i.value, 0)

      const sheet = await prisma.scoreSheet.upsert({
        where: {
          teamId_judgeId_categoryId: {
            teamId: team.id,
            judgeId: judge.id,
            categoryId: judge.categoryId,
          },
        },
        update: { total, status: 'FINAL', finalizedAt: new Date() },
        create: {
          eventId: event.id,
          teamId: team.id,
          judgeId: judge.id,
          categoryId: judge.categoryId,
          total,
          status: 'FINAL',
          finalizedAt: new Date(),
        },
      })
      await prisma.scoreItem.deleteMany({ where: { sheetId: sheet.id } })
      await prisma.scoreItem.createMany({
        data: items.map((i) => ({ sheetId: sheet.id, ...i })),
      })
      sheets += 1
    }
  }

  console.log(`  ✓ ${teams.length} tim · ${judges.length} juri · ${sheets} lembar nilai`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
