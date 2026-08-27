import { redirect } from 'next/navigation'

// Rincian nilai per butir tidak ditampilkan untuk publik.
export default function LiveTeamDetailPage() {
  redirect('/live')
}
