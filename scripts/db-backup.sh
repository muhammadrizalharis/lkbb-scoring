#!/usr/bin/env bash
# Backup database lkbb (Docker) ke folder backups/ sebagai dump terkompresi.
# Pemakaian: scripts/db-backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="backups/lkbb-$STAMP.dump"
docker exec lkbb-postgres pg_dump -U lkbb -d lkbb -Fc >"$FILE"
echo "OK: $FILE ($(du -h "$FILE" | cut -f1))"
# Simpan 30 backup terakhir saja.
ls -1t backups/lkbb-*.dump 2>/dev/null | tail -n +31 | xargs -r rm -f
