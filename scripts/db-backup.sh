#!/usr/bin/env bash
# Backup database lkbb (Docker Postgres, 127.0.0.1:5436) ke folder backups/.
#
# Memakai pg_dump host (PostgreSQL 18) lewat TCP, BUKAN `docker exec`, supaya
# tidak bergantung pada izin docker socket -> bisa dijalankan systemd --user
# timer (backup terjadwal mandiri) maupun manual, tanpa numpang resource web lain.
#
# Pemakaian: scripts/db-backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=127.0.0.1
PORT=5436
DB=lkbb
DBUSER=lkbb

# Cari pg_dump yang major >= 18 (server memakai PostgreSQL 18).
find_pgdump() {
  local candidates=(
    "$HOME/DATA_ICAL/miniforge3/envs/askara-pg/bin/pg_dump"
    "/usr/lib/postgresql/18/bin/pg_dump"
    "$(command -v pg_dump 2>/dev/null || true)"
  )
  local c major
  for c in "${candidates[@]}"; do
    [ -n "$c" ] && [ -x "$c" ] || continue
    major=$("$c" --version 2>/dev/null | grep -oE '[0-9]+' | head -1)
    if [ "${major:-0}" -ge 18 ]; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

PGDUMP=$(find_pgdump) || {
  echo "ERROR: pg_dump PostgreSQL 18 tidak ditemukan di host." >&2
  exit 1
}

# Ambil password DB dari .env (file ini di-gitignore, tidak pernah masuk repo).
if [ ! -f .env ]; then
  echo "ERROR: .env tidak ditemukan." >&2
  exit 1
fi
PASS=$(grep -E '^LKBB_DB_PASSWORD=' .env | head -1 | cut -d= -f2- | tr -d '"')
if [ -z "${PASS:-}" ]; then
  echo "ERROR: LKBB_DB_PASSWORD tidak ada di .env." >&2
  exit 1
fi

mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="backups/lkbb-$STAMP.dump"
PGPASSWORD="$PASS" "$PGDUMP" -h "$HOST" -p "$PORT" -U "$DBUSER" -d "$DB" -Fc >"$FILE"
echo "OK: $FILE ($(du -h "$FILE" | cut -f1)) via $PGDUMP"

# Simpan 30 backup terakhir saja.
ls -1t backups/lkbb-*.dump 2>/dev/null | tail -n +31 | xargs -r rm -f
