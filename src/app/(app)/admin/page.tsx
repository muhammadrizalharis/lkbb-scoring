import Link from 'next/link'

const LINKS = [
  { href: '/admin/tim', title: 'Tim Peserta', desc: 'Tambah dan kelola daftar tim beserta nomor urut tampil.' },
  { href: '/admin/juri', title: 'Juri', desc: 'Tentukan juri dan kategori yang dinilai masing-masing.' },
  { href: '/admin/kategori', title: 'Bobot Kategori', desc: 'Atur pengali tiap kategori untuk penentuan Juara Umum.' },
]

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-400"
          >
            <h2 className="font-semibold">{l.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
