# Rekapitulasi Nilai LKBB

Sistem perhitungan nilai dan perankingan otomatis untuk Lomba Ketangkasan Baris Berbaris (LKBB).
Menggantikan rekap manual yang memakan waktu berjam-jam menjadi hitungan instan.

## Latar belakang

Form penilaian resmi terdiri atas 3 lembar dan **79 butir** penilaian. Dengan 20 tim dan 6 juri,
panitia harus menjumlahkan ribuan angka secara manual. Sistem ini menghilangkan pekerjaan itu.

## Rubrik yang sudah dimuat

| Kategori | Butir | Rentang nilai |
|---|---:|---|
| PBB Gerakan Dasar | 27 | 279 – 700 |
| Komandan Pasukan | 6 | 28 – 100 |
| Variasi | 13 | 25 – 90 |
| Formasi | 14 | 40 – 110 |
| Kostum | 19 | 28 – 80 |
| **Total per juri lengkap** | **79** | **400 – 1080** |

Rentang di atas cocok persis dengan angka total yang tercetak pada form asli
(mis. Variasi+Formasi = 65–200), sebagai verifikasi bahwa rubrik tersalin dengan benar.

## Cara kerja perhitungan

1. Setiap butir hanya menerima **nilai dari daftar resminya** (mis. `Bersaf Kumpul` hanya boleh
   6, 10, 14, 18, 22, 26, 30, atau 40). Nilai di luar daftar ditolak server.
2. Nilai satu lembar = jumlah seluruh butir.
3. Nilai kategori suatu tim = **jumlah nilai seluruh juri** pada kategori itu.
4. Total tim = Σ (nilai kategori × bobot kategori) − penalti.
5. Peringkat memakai *standard competition ranking*: nilai sama berbagi peringkat (1, 2, 2, 4).
   Tim dengan total identik ditandai **SERI** — pemenang ditentukan keputusan juri.

Bobot tiap kategori dapat diubah kapan saja di **Pengaturan → Bobot Kategori**, termasuk
mengeluarkan suatu kategori dari perhitungan Juara Umum.

## Menjalankan secara lokal

```bash
nvm use                # Node 22 (lihat .nvmrc)
cp .env.example .env   # lalu isi DATABASE_URL dan AUTH_SECRET
npm install
npm run db:migrate     # buat tabel
npm run db:seed        # muat rubrik + akun admin
npm run dev
```

### Perintah lain

| Perintah | Kegunaan |
|---|---|
| `npm run demo -- --reset` | Isi data contoh (5 tim, 6 juri, nilai acak) untuk latihan panitia |
| `npm run db:studio` | Membuka Prisma Studio untuk memeriksa data |
| `npm run typecheck` | Pemeriksaan tipe |

> **Sebelum lomba sungguhan**, hapus data latihan dengan `npm run demo -- --reset`
> lalu hapus tim/juri contoh melalui menu Pengaturan.

## Alur pemakaian saat lomba

1. **Pengaturan → Tim Peserta**: masukkan seluruh tim beserta nomor urut tampil.
2. **Pengaturan → Juri**: masukkan juri dan kategori yang dinilai masing-masing.
3. **Input Nilai**: operator memilih kotak tim × juri, lalu menyalin nilai dari lembar kertas juri
   dengan cara menekan tombol angka. Total tampil langsung di bawah layar.
4. Tekan **Simpan & Finalkan** bila seluruh butir sudah terisi.
5. **Rekapitulasi**: peringkat, juara per kategori, dan tombol unduh CSV tersedia seketika.

Warna pada halaman Input Nilai: hijau = sudah final, kuning = tersimpan sebagian, abu = belum diisi.

## Keamanan

- Kata sandi disimpan sebagai hash bcrypt (12 putaran).
- Sesi memakai JWT HS256 pada cookie `httpOnly`, `sameSite=lax`, `secure` di produksi.
- Percobaan login dibatasi untuk meredam brute force.
- Seluruh nilai divalidasi ulang di server terhadap daftar opsi resmi; nilai palsu ditolak.
- Penghapusan tim/juri diblokir bila sudah memiliki nilai tersimpan.
- Setiap penyimpanan nilai dicatat pada `AuditLog` (siapa, kapan, berapa).
- Ekspor CSV diberi awalan kutip pada sel berawalan `=`, `+`, `-`, `@` untuk mencegah CSV injection.

## Struktur

```
prisma/rubric.ts       Data rubrik 79 butir — sumber kebenaran, disalin dari form resmi
prisma/schema.prisma   Skema basis data
src/lib/scoring.ts     Agregasi nilai, penalti, peringkat, deteksi seri
src/lib/auth.ts        Sesi, peran, pembatas login
src/app/(app)/input    Halaman input nilai operator
src/app/(app)/rekap    Halaman rekapitulasi & peringkat
```

## Catatan rubrik

Pada form asli, butir **B8 "Ganti Langkah"** mencantumkan angka **24 dua kali** pada dua kolom
terakhir. Duplikat tersebut dihilangkan sehingga butir ini memiliki 7 pilihan (12–24); nilai
maksimum kategori tidak berubah. Mohon dikonfirmasi ke penyusun form apakah kolom terakhir
seharusnya bernilai lain.
