import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, hasAtLeast } from '@/lib/auth'
import { AddUserForm } from './AddUserForm'
import { ResetPasswordForm } from './ResetPasswordForm'
import { deleteUserAction, restoreUserAction } from './actions'

export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATOR: 'Operator',
  VIEWER: 'Viewer',
}
const ROLE_TONE: Record<string, string> = {
  SUPER_ADMIN: 'bg-primary/10 text-primary dark:text-blue-300',
  ADMIN: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  OPERATOR: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  VIEWER: 'bg-muted text-muted-foreground',
}

export default async function PenggunaPage() {
  const session = await getSession()
  if (!session) notFound()
  if (!hasAtLeast(session.role, 'SUPER_ADMIN')) redirect('/admin')

  const users = await prisma.user.findMany({ orderBy: [{ role: 'asc' }, { username: 'asc' }] })
  const activeUsers = users.filter((u) => !u.deletedAt)
  const deletedUsers = users.filter((u) => u.deletedAt)
  const superCount = activeUsers.filter((u) => u.role === 'SUPER_ADMIN').length

  const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground underline">
        ← Kembali ke Pengaturan
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola Akun</h1>
        <p className="text-sm text-muted-foreground">
          Buat akun operator agar tiap petugas login sendiri. Semua akun berbagi database yang sama,
          jadi status input tersinkron dan tidak ada tim yang terinput dua kali.
        </p>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <h2 className="mb-3 font-semibold">Tambah akun</h2>
        <AddUserForm />
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Daftar akun ({activeUsers.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Peran</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activeUsers.map((u) => {
              const isSelf = u.id === session.userId
              const lastSuper = u.role === 'SUPER_ADMIN' && superCount <= 1
              return (
                <tr key={u.id}>
                  <td className="px-4 py-2 font-medium">
                    {u.username}
                    {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(Anda)</span>}
                  </td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ROLE_TONE[u.role]}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-3">
                      <ResetPasswordForm userId={u.id} />
                      {!isSelf && !lastSuper && (
                        <form action={deleteUserAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="text-sm text-red-600 transition hover:underline">Hapus</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {deletedUsers.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-amber-500/30">
          <div className="border-b border-border bg-amber-500/5 px-4 py-3">
            <h2 className="font-semibold text-amber-700 dark:text-amber-300">
              Akun terhapus ({deletedUsers.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Akun ini dinonaktifkan namun datanya tetap tersimpan. Klik “Pulihkan” untuk
              mengaktifkannya kembali tanpa perlu backup.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Peran</th>
                <th className="px-4 py-2">Dihapus</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deletedUsers.map((u) => (
                <tr key={u.id} className="text-muted-foreground">
                  <td className="px-4 py-2 font-medium line-through">{u.username}</td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ROLE_TONE[u.role]}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">{u.deletedAt ? dateFmt.format(u.deletedAt) : '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end">
                      <form action={restoreUserAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="text-sm font-medium text-emerald-600 transition hover:underline dark:text-emerald-400">
                          Pulihkan
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
