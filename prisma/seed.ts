import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { RUBRIC, categoryRange } from './rubric.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL belum diset')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const EVENT_SLUG = process.env.SEED_EVENT_SLUG ?? 'lkbb-smantib'
const EVENT_NAME = process.env.SEED_EVENT_NAME ?? 'LKBB SMANTIB'

async function seedAdmin() {
  const username = process.env.SEED_ADMIN_USERNAME
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!username || !password) {
    console.warn('  ! SEED_ADMIN_USERNAME/SEED_ADMIN_PASSWORD kosong — admin tidak dibuat.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  // Password tidak ditimpa agar perubahan lewat aplikasi tidak hilang saat redeploy.
  await prisma.user.upsert({
    where: { username },
    update: { role: 'SUPER_ADMIN' },
    create: { username, name: process.env.SEED_ADMIN_NAME ?? 'Administrator', passwordHash, role: 'SUPER_ADMIN' },
  })
  console.log(`  ✓ admin "${username}"`)
}

async function seedRubric() {
  const event = await prisma.event.upsert({
    where: { slug: EVENT_SLUG },
    update: {},
    create: { slug: EVENT_SLUG, name: EVENT_NAME },
  })

  const scored = await prisma.scoreItem.count({ where: { sheet: { eventId: event.id } } })
  if (scored > 0) {
    console.log(`  · rubrik dilewati: sudah ada ${scored} nilai tersimpan (data lomba dilindungi).`)
    return event
  }

  for (const [index, cat] of RUBRIC.entries()) {
    const { min, max } = categoryRange(cat)

    const category = await prisma.category.upsert({
      where: { eventId_code: { eventId: event.id, code: cat.code } },
      update: { name: cat.name, order: index, minScore: min, maxScore: max },
      create: { eventId: event.id, code: cat.code, name: cat.name, order: index, minScore: min, maxScore: max },
    })

    // Aman: belum ada nilai tersimpan, jadi rubrik boleh ditulis ulang persis sesuai form.
    await prisma.criterionGroup.deleteMany({ where: { categoryId: category.id } })

    for (const [gi, group] of cat.groups.entries()) {
      await prisma.criterionGroup.create({
        data: {
          categoryId: category.id,
          code: group.code,
          name: group.name,
          order: gi,
          criteria: {
            create: group.criteria.map((c, ci) => ({ name: c.name, order: ci, options: c.options })),
          },
        },
      })
    }

    const count = cat.groups.reduce((n, g) => n + g.criteria.length, 0)
    console.log(`  ✓ ${cat.code.padEnd(8)} ${String(count).padStart(2)} butir · rentang ${min}–${max}`)
  }

  return event
}

/**
 * Data contoh untuk demonstrasi UI (mis. di Vercel). Hanya jalan bila SEED_DEMO=1
 * dan belum ada satu tim pun, sehingga tidak menimpa data sungguhan saat redeploy.
 */
async function seedDemo(eventId: string) {
  const existing = await prisma.team.count({ where: { eventId } })
  if (existing > 0) {
    console.log(`  · demo dilewati: sudah ada ${existing} tim.`)
    return
  }

  const teams = [
    'Paskibra SMAN 1 Tinambung',
    'Paskibra SMAN 2 Polewali',
    'Paskibra SMAN 3 Majene',
    'Paskibra SMKN 1 Wonomulyo',
    'Paskibra MAN 1 Mamuju',
  ]
  for (const [i, name] of teams.entries()) {
    await prisma.team.create({ data: { eventId, number: i + 1, name } })
  }

  const categories = await prisma.category.findMany({
    where: { eventId },
    include: { groups: { include: { criteria: true } } },
  })

  // Dua juri untuk PBB agar penjumlahan antar juri ikut terlihat di demo.
  for (const category of categories) {
    const judgeNums = category.code === 'PBB' ? [1, 2] : [1]
    for (const n of judgeNums) {
      await prisma.judge.create({
        data: { eventId, categoryId: category.id, code: `${category.code}-${n}`, name: `Juri ${category.code}-${n}` },
      })
    }
  }

  const allTeams = await prisma.team.findMany({ where: { eventId } })
  const judges = await prisma.judge.findMany({ where: { eventId } })
  const criteriaByCategory = new Map(
    categories.map((c) => [c.id, c.groups.flatMap((g) => g.criteria)]),
  )

  let sheets = 0
  for (const team of allTeams) {
    for (const judge of judges) {
      const criteria = criteriaByCategory.get(judge.categoryId) ?? []
      const items = criteria.map((c) => ({
        criterionId: c.id,
        value: c.options[Math.floor(Math.random() * c.options.length)],
      }))
      const total = items.reduce((s, it) => s + it.value, 0)
      await prisma.scoreSheet.create({
        data: {
          eventId,
          teamId: team.id,
          judgeId: judge.id,
          categoryId: judge.categoryId,
          total,
          status: 'FINAL',
          finalizedAt: new Date(),
          items: { create: items },
        },
      })
      sheets += 1
    }
  }

  console.log(`  ✓ demo: ${allTeams.length} tim · ${judges.length} juri · ${sheets} lembar nilai`)
}

async function main() {
  console.log(`Seeding "${EVENT_NAME}" (${EVENT_SLUG})`)
  await seedAdmin()
  const event = await seedRubric()

  const cats = await prisma.category.findMany({ where: { eventId: event.id } })
  const totalMin = cats.reduce((n, c) => n + c.minScore, 0)
  const totalMax = cats.reduce((n, c) => n + c.maxScore, 0)
  console.log(`  Σ total per juri lengkap: ${totalMin}–${totalMax}`)

  if (process.env.SEED_DEMO === '1') await seedDemo(event.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
