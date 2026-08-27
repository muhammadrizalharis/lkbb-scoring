#!/usr/bin/env bash
# Build khusus Vercel. Neon menyuntikkan DATABASE_URL (pooled, via pgbouncer) dan
# DATABASE_URL_UNPOOLED (koneksi langsung). Migrasi & seed WAJIB lewat koneksi langsung
# karena pgbouncer tidak mendukung beberapa perintah migrasi.
set -euo pipefail

prisma generate

# Hanya jalankan migrasi/seed bila database tersedia (mis. Neon sudah terpasang).
if [ -n "${DATABASE_URL:-}" ] || [ -n "${DATABASE_URL_UNPOOLED:-}" ]; then
  DIRECT_URL="${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}"
  DATABASE_URL="$DIRECT_URL" prisma migrate deploy
  DATABASE_URL="$DIRECT_URL" prisma db seed
else
  echo "! DATABASE_URL belum diset — melewati migrasi & seed."
fi

next build
