#!/usr/bin/env bash
# Restore database lkbb dari file dump.
# Pemakaian: scripts/db-restore.sh backups/lkbb-YYYYMMDD-HHMMSS.dump
set -euo pipefail
cd "$(dirname "$0")/.."
FILE="${1:?Pemakaian: $0 <file.dump>}"
[ -f "$FILE" ] || { echo "File tidak ada: $FILE"; exit 1; }

echo "PERINGATAN: seluruh isi database lkbb sekarang akan DIGANTI dengan $FILE"
read -rp "Ketik 'YA' untuk lanjut: " ok
[ "$ok" = "YA" ] || { echo "Dibatalkan."; exit 1; }

# Kosongkan skema lalu restore.
docker exec -i lkbb-postgres psql -U lkbb -d lkbb -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -i lkbb-postgres pg_restore -U lkbb -d lkbb --no-owner --no-privileges <"$FILE"
echo "Restore selesai dari $FILE"
