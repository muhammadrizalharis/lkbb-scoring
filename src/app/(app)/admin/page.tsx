import Link from 'next/link'
import { getSession, hasAtLeast } from '@/lib/auth'

const LINKS = [
  { href: '/admin/tim', title: 'Tim Peserta', desc: 'Tambah dan kelola daftar tim beserta nomor urut tampil.' },
  { href: '/admin/juri', title: 'Juri', desc: 'Tentukan juri dan kategori yang dinilai masing-masing.' },
  { href: '/admin/kategori', title: 'Bobot Kategori', desc: 'Atur pengali tiap kategori untuk penentuan Juara Umum.' },
]

const SUPER_LINKS = [
  {
    href: '/admin/event',
    title: 'Identitas Lomba',
    desc: 'Ubah nama lomba & penyelenggara, dan aktifkan mode LIVE (badge transparan di header).',
  },
  {
    href: '/admin/rubrik',
    title: 'Format Penilaian (Rubrik)',
    desc: 'Susun sendiri kategori, grup, butir, dan pilihan nilai. Khusus Super Admin.',
  },
  {
    href: '/admin/juara-umum',
    title: 'Perhitungan Juara Umum',
    desc: 'Pilih metode (poin medali / akumulasi nilai) dan atur poin emas/perak/perunggu.',
  },
  {
    href: '/admin/reset',
    title: 'Reset Data Lomba',
    desc: 'Kosongkan data demo/lama (tim, juri, nilai) untuk mulai event baru. Rubrik tetap aman.',
  },
]

export default async function AdminPage() {
  const session = await getSession()
  const links = session && hasAtLeast(session.role, 'SUPER_ADMIN') ? [...LINKS, ...SUPER_LINKS] : LINKS

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border transition hover:ring-primary/40"
          >
            <h2 className="font-semibold">{l.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
