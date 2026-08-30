# Unit systemd (mode `--user`) untuk backup database mandiri

> **Catatan:** sejak seluruh stack dipindah ke Docker, backup dijalankan oleh service
> `backup` di `docker-compose.yml`. Unit systemd di sini disimpan sebagai **fallback**
> (mis. bila ingin menjalankan backup tanpa Docker). Untuk setup normal, cukup
> `docker compose up -d`.

Backup lkbb punya jadwal & penyimpanannya sendiri, tidak menumpang layanan lain.
Salin kedua berkas di folder ini ke `~/.config/systemd/user/`, lalu aktifkan timer.

```bash
cp deploy/systemd/lkbb-backup.service deploy/systemd/lkbb-backup.timer \
   ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now lkbb-backup.timer   # jadwal harian ~03:10
loginctl enable-linger "$USER"                    # tetap jalan walau belum login
```

Cek jadwal berikutnya dan jalankan sekali secara manual:

```bash
systemctl --user list-timers lkbb-backup.timer
systemctl --user start lkbb-backup.service
```

Catatan: `lkbb-backup.service` memanggil `scripts/db-backup.sh`, yang memakai
`pg_dump` PostgreSQL 18 dari host lewat TCP (`127.0.0.1:5436`) — bukan `docker exec` —
sehingga tidak butuh izin docker socket dan aman dijalankan oleh timer `--user`.
Password DB dibaca dari `.env` (`LKBB_DB_PASSWORD`), yang tidak pernah masuk repo.
