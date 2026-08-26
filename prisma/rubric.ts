/**
 * Rubrik penilaian LKBB SMANTIB.
 * Seluruh angka disalin persis dari form penilaian resmi (3 lembar).
 * `options` = daftar nilai sah per butir; juri hanya boleh memilih salah satu.
 */

export type RubricCriterion = {
  name: string
  options: number[]
}

export type RubricGroup = {
  code?: string
  name: string
  criteria: RubricCriterion[]
}

export type RubricCategory = {
  code: string
  name: string
  groups: RubricGroup[]
}

export const RUBRIC: RubricCategory[] = [
  {
    code: 'PBB',
    name: 'PBB Gerakan Dasar',
    groups: [
      {
        code: 'A',
        name: 'Gerakan Tambahan',
        criteria: [{ name: 'Bersaf Kumpul', options: [6, 10, 14, 18, 22, 26, 30, 40] }],
      },
      {
        code: 'B',
        name: 'Gerakan Berjalan ke Berjalan',
        criteria: [
          { name: 'Hadap Kiri Maju', options: [10, 14, 16, 18, 20, 22, 24, 26] },
          { name: 'Balik Kanan Maju', options: [10, 12, 14, 16, 18, 20, 22, 26] },
          { name: 'Langkah Biasa ke Langkah Tegap', options: [8, 10, 12, 14, 16, 18, 20, 24] },
          { name: 'Hormat Kiri', options: [16, 20, 22, 24, 26, 28, 30, 32] },
          { name: 'Langkah Tegap ke Langkah Biasa', options: [8, 10, 12, 14, 16, 18, 20, 24] },
          { name: 'Tiap-Tiap Banjar 2 Kali Belok Kanan', options: [10, 12, 14, 16, 18, 20, 22, 24] },
          // Form asli menulis 24 dua kali pada dua kolom terakhir (kemungkinan salah ketik).
          { name: 'Ganti Langkah', options: [12, 14, 16, 18, 20, 22, 24] },
          { name: 'Belok Kiri 2 Kali', options: [12, 14, 16, 18, 20, 22, 24, 26] },
          { name: 'Langkah Perlahan', options: [10, 12, 14, 16, 18, 20, 22, 24] },
          { name: '2 Kali Belok Kiri', options: [12, 14, 16, 18, 20, 22, 24, 26] },
          { name: 'Langkah Biasa ke Langkah Lari', options: [10, 12, 14, 16, 18, 20, 22, 24] },
          { name: 'Tiap-Tiap Banjar 2 Kali Belok Kiri', options: [12, 14, 16, 18, 20, 22, 24, 28] },
        ],
      },
      {
        code: 'C',
        name: 'Gerakan Berjalan ke Berhenti',
        criteria: [{ name: 'Hadap Kiri Henti', options: [12, 15, 17, 19, 21, 22, 24, 26] }],
      },
      {
        code: 'D',
        name: 'Gerakan Berpindah Tempat',
        criteria: [
          { name: '3 Langkah Belakang', options: [9, 11, 13, 15, 17, 19, 21, 24] },
          { name: '4 Langkah ke Kiri', options: [9, 11, 13, 15, 17, 19, 21, 24] },
          { name: '3 Langkah ke Kanan', options: [9, 11, 13, 15, 17, 19, 21, 24] },
        ],
      },
      {
        code: 'E',
        name: 'Gerakan Ditempat',
        criteria: [
          { name: '1/2 Lengan Lencang Kanan', options: [10, 12, 14, 16, 18, 20, 22, 24] },
          { name: 'Lencang Kanan', options: [10, 12, 14, 16, 18, 20, 22, 24] },
          { name: 'Hormat', options: [16, 18, 20, 22, 24, 26, 28, 30] },
          { name: 'Hitung', options: [10, 12, 14, 16, 18, 20, 22, 24] },
          { name: 'Parade Periksa Kerapihan', options: [12, 16, 18, 20, 22, 24, 26, 28] },
          { name: 'Hadap Kanan', options: [9, 11, 13, 15, 17, 19, 21, 22] },
          { name: 'Lencang Depan', options: [6, 8, 10, 12, 14, 16, 18, 20] },
          { name: 'Jalan di Tempat', options: [10, 12, 14, 16, 18, 20, 22, 24] },
          { name: 'Hadap Kiri (Henti)', options: [10, 12, 14, 16, 18, 20, 22, 26] },
        ],
      },
      {
        code: 'F',
        name: 'Gerakan Tambahan',
        criteria: [{ name: 'Bubar Jalan', options: [11, 14, 17, 20, 23, 26, 29, 32] }],
      },
    ],
  },
  {
    code: 'DANTON',
    name: 'Komandan Pasukan',
    groups: [
      {
        name: 'Komandan Pasukan',
        criteria: [
          { name: 'Sikap Badan', options: [4, 6, 8, 10, 12, 14, 16] },
          { name: 'Volume Suara', options: [4, 6, 8, 10, 12, 14, 16] },
          { name: 'Artikulasi Pengucapan', options: [6, 8, 10, 12, 14, 16, 18] },
          { name: 'Penguasaan Materi', options: [6, 8, 10, 12, 14, 16, 18] },
          { name: 'Penguasaan Lapangan', options: [4, 6, 8, 10, 12, 14, 16] },
          { name: 'Penguasaan Pasukan', options: [4, 6, 8, 10, 12, 14, 16] },
        ],
      },
    ],
  },
  {
    code: 'VARIASI',
    name: 'Variasi',
    groups: [
      {
        code: 'A',
        name: 'Kreativitas',
        criteria: [
          { name: 'Opening Variasi', options: [1, 2, 3, 4, 5, 6] },
          { name: 'Isi Pesan', options: [2, 3, 4, 5, 6, 7] },
          { name: 'Ragam Gerak', options: [2, 3, 4, 5, 6, 7] },
        ],
      },
      {
        code: 'B',
        name: 'Dinamika & Struktur Badan',
        criteria: [
          { name: 'Kesesuaian Gerakan dengan Isi Pesan', options: [2, 3, 4, 5, 6, 7] },
          { name: 'Estetika, Kesopanan & Keamanan Gerakan', options: [1, 2, 3, 4, 5, 6] },
          { name: 'Tingkat Kesulitan & Detail Gerakan', options: [3, 4, 5, 6, 7, 8] },
          { name: 'Kerapihan Saft Banjar & Kekompakan Gerakan', options: [3, 4, 5, 6, 7, 8] },
          { name: 'Kesesuaian Format Barisan', options: [1, 2, 3, 4, 5, 6] },
        ],
      },
      {
        code: 'C',
        name: 'Pasukan',
        criteria: [
          { name: 'Penjiwaan dalam Penampilan & Artikulasi, Intonasi', options: [2, 3, 4, 5, 6, 7] },
          { name: 'Semangat dan Kestabilan Penampilan', options: [2, 3, 4, 5, 6, 7] },
        ],
      },
      {
        code: 'D',
        name: 'Komandan',
        criteria: [
          { name: 'Penjiwaan dalam Penampilan & Artikulasi, Intonasi', options: [3, 4, 5, 6, 7, 8] },
          { name: 'Semangat dan Kestabilan Penampilan', options: [2, 3, 4, 5, 6, 7] },
          { name: 'Penguasaan Lapangan, Materi & Aba-aba', options: [1, 2, 3, 4, 5, 6] },
        ],
      },
    ],
  },
  {
    code: 'FORMASI',
    name: 'Formasi',
    groups: [
      {
        code: 'A',
        name: 'Dinamika & Struktur Gerakan',
        criteria: [
          { name: 'Kesesuaian Gerakan dengan Isi Pesan', options: [2, 3, 4, 5, 6, 7] },
          { name: 'Estetika, Kesopanan & Keamanan Gerakan', options: [1, 2, 3, 4, 5, 6] },
          { name: 'Detail Gerakan, Kerapihan & Kekompakan Gerakan', options: [3, 4, 5, 6, 7, 8] },
        ],
      },
      {
        code: 'B',
        name: 'Proses Buka Tutup & Akhir Formasi',
        criteria: [
          { name: 'Kelurusan Barisan Shaft, Banjar, Simetris pada Bentuk Akhir', options: [3, 4, 5, 6, 7, 8] },
          { name: 'Tingkat Kesulitan Proses Buka & Tutup', options: [4, 5, 6, 7, 8, 9] },
        ],
      },
      {
        code: 'C',
        name: 'Pasukan',
        criteria: [
          { name: 'Penjiwaan dalam Penampilan & Artikulasi, Intonasi', options: [3, 4, 5, 6, 7, 8] },
          { name: 'Semangat dan Kestabilan Penampilan', options: [2, 3, 4, 5, 6, 7] },
        ],
      },
      {
        code: 'D',
        name: 'Komandan',
        criteria: [
          { name: 'Penjiwaan dalam Penampilan & Artikulasi, Intonasi', options: [3, 4, 5, 6, 7, 8] },
          { name: 'Semangat dan Kestabilan Penampilan', options: [3, 4, 5, 6, 7, 8] },
          { name: 'Penguasaan Lapangan, Materi & Aba-aba', options: [3, 4, 5, 6, 7, 8] },
        ],
      },
      {
        code: 'E',
        name: 'All Performance Varfor',
        criteria: [{ name: 'Semangat dan Kestabilan Penampilan', options: [3, 4, 5, 6, 7, 8] }],
      },
      {
        code: 'F',
        name: 'Kreativitas',
        criteria: [
          { name: 'Pengembangan Isi Pesan', options: [5, 6, 7, 8, 9, 10] },
          { name: 'Jelajah Lapangan', options: [3, 4, 5, 6, 7, 8] },
          { name: 'Ending Celebration', options: [2, 3, 4, 5, 6, 7] },
        ],
      },
    ],
  },
  {
    code: 'KOSTUM',
    name: 'Kostum',
    groups: [
      {
        name: 'Penutup Kepala',
        criteria: [
          { name: 'Kesesuaian Gender/Konsep', options: [2, 4, 5] },
          { name: 'Keselarasan Penutup Kepala dengan Kostum', options: [1, 2, 3] },
          { name: 'Kerapihan & Kebersihan', options: [1, 3, 5] },
        ],
      },
      {
        name: 'Baju/Celana/Rok',
        criteria: [
          { name: 'Kesesuaian dengan Baju/Atasan', options: [1, 2, 3] },
          { name: 'Body Fitting/Ukuran Baju', options: [1, 3, 5] },
          { name: 'Cuttingan', options: [1, 3, 5] },
          { name: 'Design Kostum', options: [1, 3, 5] },
          { name: 'Keselarasan Kostum dengan Konsep Performa', options: [2, 4, 6] },
          { name: 'Keselarasan Warna', options: [1, 2, 3] },
          { name: 'Kharisma Pembawaan Kostum', options: [2, 4, 5] },
          { name: 'Kesopanan', options: [2, 3, 4] },
          { name: 'Kerapihan', options: [2, 3, 4] },
          { name: 'Kebersihan', options: [2, 3, 4] },
        ],
      },
      {
        name: 'Sepatu/Alas Kaki',
        criteria: [
          { name: 'Kesesuaian Sepatu dengan Design Seragam', options: [2, 3, 4] },
          { name: 'Kerapihan Penggunaan', options: [1, 2, 3] },
          { name: 'Kebersihan Penggunaan', options: [1, 2, 3] },
        ],
      },
      {
        name: 'Kreativitas & Atribut',
        criteria: [
          { name: 'Kesesuaian Atribut dengan Design Kostum', options: [2, 3, 4] },
          { name: 'Kerapihan & Kebersihan', options: [1, 3, 5] },
          { name: 'Kekuatan Atribut & Kostum', options: [2, 3, 4] },
        ],
      },
    ],
  },
]

export function categoryRange(category: RubricCategory) {
  let min = 0
  let max = 0
  for (const group of category.groups) {
    for (const criterion of group.criteria) {
      min += Math.min(...criterion.options)
      max += Math.max(...criterion.options)
    }
  }
  return { min, max }
}

export function criterionCount(category: RubricCategory) {
  return category.groups.reduce((n, g) => n + g.criteria.length, 0)
}
