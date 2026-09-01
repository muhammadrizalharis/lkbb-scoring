#!/usr/bin/env node
/**
 * Bot ops Paskitactical (lkbb) — Telegram long polling, TANPA webhook.
 * Hanya melayani chat developer (TELEGRAM_CHAT_ID).
 *
 * Perintah UMUM (bebas):
 *   /status /health /logs /backups /stats /help
 * Perintah KRUSIAL (butuh buka kunci dulu: /unlock <secret>):
 *   /restart /rebuild /up /down /backup /live_on /live_off
 *
 * Konfigurasi dibaca dari ~/lkbb-scoring/.env (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
 * PASKITACTICAL_BOT_SECRET). Perintah docker dijalankan lewat `sg docker -c` karena
 * systemd --user tidak mewarisi grup docker.
 */
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const HOME = homedir()
const REPO = join(HOME, 'lkbb-scoring')
const PUBLIC_URL = 'https://euphemism-hydroxide-caution.ngrok-free.dev'

function readEnv() {
  const env = {}
  for (const line of readFileSync(join(REPO, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^"/, '').replace(/"\s*$/, '').trim()
  }
  return env
}

const env = readEnv()
const TOKEN = env.TELEGRAM_BOT_TOKEN
const CHAT_ID = env.TELEGRAM_CHAT_ID
const SECRET = env.PASKITACTICAL_BOT_SECRET
const API = `https://api.telegram.org/bot${TOKEN}`

if (!TOKEN || !CHAT_ID) {
  console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID belum diisi di .env')
  process.exit(1)
}

/** Jalankan perintah shell (dengan grup docker) di direktori repo. */
function sh(cmd, timeoutMs = 60_000) {
  return new Promise((resolve) => {
    execFile('sg', ['docker', '-c', cmd], { cwd: REPO, timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
      const out = ((stdout || '') + (stderr ? '\n' + stderr : '')).trim()
      resolve(out || (err ? String(err) : '(tanpa output)'))
    })
  })
}

async function send(text) {
  const body = text.length > 3900 ? text.slice(-3900) : text
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: body }),
  }).catch(() => {})
}

// --- Buka-kunci sesi untuk perintah krusial (5 menit) ---
let unlockedUntil = 0
const UNLOCK_MS = 5 * 60_000
const isUnlocked = () => Date.now() < unlockedUntil

// --- Perintah umum ---
async function status() {
  const ps = await sh("docker ps -a --filter name=lkbb --format '{{.Names}}: {{.Status}}' | sort")
  const armed = isUnlocked() ? `\n\n🔓 Krusial terbuka ${Math.ceil((unlockedUntil - Date.now()) / 60000)} mnt lagi` : ''
  return '📦 Container lkbb:\n' + ps + armed
}
async function health() {
  const local = await sh("curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1:48300/api/live/version")
  const pub = await sh(`curl -s -o /dev/null -w '%{http_code}' --max-time 10 -H 'ngrok-skip-browser-warning: 1' ${PUBLIC_URL}/live`)
  const ok = (c) => (c === '200' ? '✅' : `⚠️ ${c}`)
  return `🌐 Health\n• App lokal (48300): ${ok(local)}\n• Publik (/live): ${ok(pub)}\n${PUBLIC_URL}`
}
async function logs() {
  return '📜 Log app (25 baris terakhir):\n' + (await sh('docker logs lkbb-app --tail 25 2>&1'))
}
async function backups() {
  const out = await sh("ls -lt backups/*.dump 2>/dev/null | head -6 | awk '{print $5, $6, $7, $8, $9}'")
  return '💾 Backup terbaru:\n' + (out || '(belum ada)')
}
async function stats() {
  const meta = await sh(`docker exec lkbb-postgres psql -U lkbb -d lkbb -tA -c 'SELECT name, "liveMode" FROM "Event" LIMIT 1'`)
  const cnt = await sh(`docker exec lkbb-postgres psql -U lkbb -d lkbb -tA -c 'SELECT (SELECT count(*) FROM "Team"), (SELECT count(*) FROM "Judge"), (SELECT count(*) FROM "ScoreSheet")'`)
  const [name, live] = meta.split('|')
  const [teams, judges, sheets] = cnt.split('|')
  return `📊 Statistik\n• Lomba: ${name}\n• Mode LIVE: ${live === 't' ? 'AKTIF 🔴' : 'nonaktif ⚪'}\n• Tim: ${teams} | Juri: ${judges} | Lembar nilai: ${sheets}`
}
async function setLive(on) {
  await sh(`docker exec lkbb-postgres psql -U lkbb -d lkbb -c 'UPDATE "Event" SET "liveMode"=${on}'`)
  return on === 'true' ? '🔴 Mode LIVE DINYALAKAN — papan skor publik aktif.' : '⚪ Mode LIVE dimatikan.'
}

const HELP = [
  '🤖 Bot ops Paskitactical (LKBB)',
  '',
  'Umum (bebas):',
  '/status — status container',
  '/health — cek app lokal & publik',
  '/logs — 25 baris log app',
  '/backups — daftar backup terbaru',
  '/stats — jumlah tim/juri/lembar + Mode LIVE',
  '/url — link publik + status tunnel',
  '/disk — sisa disk & ukuran backup',
  '',
  'Krusial (buka kunci dulu: /unlock <secret>):',
  '/live_on · /live_off — nyalakan/matikan Mode LIVE',
  '/restart — restart app',
  '/restart_tunnel — restart tunnel (URL publik pulih)',
  '/rebuild — build ulang + deploy app',
  '/up · /down — start/stop app',
  '/backup — backup DB sekarang',
  '/lock — kunci lagi',
].join('\n')

async function handle(text) {
  const parts = text.trim().split(/\s+/)
  const cmd = parts[0].slice(1).split('@')[0].toLowerCase()
  const arg = parts[1]

  switch (cmd) {
    case 'start':
    case 'help':
      return send(HELP)
    case 'status':
      return send(await status())
    case 'health':
      return send(await health())
    case 'logs':
    case 'log':
      return send(await logs())
    case 'backups':
      return send(await backups())
    case 'stats':
      return send(await stats())
    case 'url':
      return send(`🔗 URL publik:\n${PUBLIC_URL}\n\nTunnel: ` + (await sh("docker ps --filter name=lkbb-tunnel --format '{{.Status}}'")))
    case 'disk': {
      const df = await sh("df -h /home | tail -1 | awk '{print $4\" bebas dari \"$2\" (\"$5\" terpakai)\"}'")
      const bu = await sh('du -sh backups 2>/dev/null | cut -f1')
      const nb = await sh('ls -1 backups/*.dump 2>/dev/null | wc -l')
      return send(`🗄️ Disk: ${df}\n💾 Backups: ${bu} (${nb} file)`)
    }
    case 'unlock':
      if (arg && arg === SECRET) {
        unlockedUntil = Date.now() + UNLOCK_MS
        return send('🔓 Perintah krusial terbuka 5 menit.')
      }
      return send('❌ Secret salah atau kosong. Format: /unlock <secret>')
    case 'lock':
      unlockedUntil = 0
      return send('🔒 Dikunci kembali.')
  }

  const crucial = ['restart', 'rebuild', 'up', 'down', 'backup', 'live_on', 'live_off', 'restart_tunnel', 'tunnel']
  if (crucial.includes(cmd)) {
    if (!isUnlocked()) return send('🔒 Perintah krusial. Buka kunci dulu:\n/unlock <secret>')
    switch (cmd) {
      case 'live_on':
        return send(await setLive('true'))
      case 'live_off':
        return send(await setLive('false'))
      case 'restart':
        await send('⏳ Restart app…')
        return send('✅ ' + (await sh('docker restart lkbb-app', 90_000)))
      case 'up':
        await send('⏳ Start app…')
        return send('✅ ' + (await sh('docker start lkbb-app', 60_000)))
      case 'down':
        await send('⏳ Stop app…')
        return send('🛑 ' + (await sh('docker stop lkbb-app', 60_000)))
      case 'rebuild':
        await send('⏳ Build ulang + deploy app (bisa 1–2 menit)…')
        return send(await sh('docker compose up -d --build app 2>&1 | tail -8', 300_000))
      case 'backup':
        await send('⏳ Backup DB…')
        return send(
          await sh(
            `docker exec lkbb-backup sh -c 'F=/backups/lkbb-$(date +%Y%m%d-%H%M%S).dump; pg_dump -h db -U lkbb -d lkbb -Fc > "$F" && echo "OK: $(basename "$F") ($(wc -c <"$F") bytes)"'`,
            120_000,
          ),
        )
      case 'restart_tunnel':
      case 'tunnel':
        await send('⏳ Restart tunnel ngrok…')
        await sh('docker restart lkbb-tunnel', 60_000)
        await new Promise((r) => setTimeout(r, 4000))
        return send('✅ Tunnel di-restart.\n' + PUBLIC_URL)
    }
  }

  return send(`Perintah tidak dikenal: /${cmd}\n\n${HELP}`)
}

// --- Monitor otomatis: peringatan proaktif bila situs publik down ---
const MON_INTERVAL = 90_000
let failStreak = 0
let alertedDown = false
async function monitorTick() {
  const code = await sh(`curl -s -o /dev/null -w '%{http_code}' --max-time 12 -H 'ngrok-skip-browser-warning: 1' ${PUBLIC_URL}/manifest.webmanifest`)
  if (code !== '200') {
    failStreak += 1
    if (failStreak >= 2 && !alertedDown) {
      alertedDown = true
      await send(`🚨 SITUS PUBLIK DOWN (HTTP ${code || 'timeout'}).\nCoba: /unlock <secret> lalu /restart_tunnel (atau /restart).`)
    }
  } else {
    if (alertedDown) await send('✅ Situs publik PULIH kembali.')
    failStreak = 0
    alertedDown = false
  }
}
setInterval(() => monitorTick().catch(() => {}), MON_INTERVAL)

let offset = 0
console.log(`[${new Date().toISOString()}] Bot ops lkbb mulai polling…`)
await send('🤖 Bot ops LKBB aktif. Ketik /help untuk daftar perintah.')

for (;;) {
  try {
    const res = await fetch(`${API}/getUpdates?timeout=50&offset=${offset}&allowed_updates=["message"]`, {
      signal: AbortSignal.timeout(60_000),
    })
    const data = await res.json()
    if (!data.ok) {
      if (data.error_code === 409) await fetch(`${API}/deleteWebhook`).catch(() => {})
      await new Promise((r) => setTimeout(r, 5000))
      continue
    }
    for (const upd of data.result) {
      offset = upd.update_id + 1
      const msg = upd.message
      if (!msg?.text?.startsWith('/')) continue
      if (String(msg.chat?.id) !== String(CHAT_ID)) continue // hanya developer
      console.log(`[${new Date().toISOString()}] ${msg.text}`)
      await handle(msg.text.trim()).catch((e) => send('⚠️ Error: ' + (e?.message ?? e)))
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] polling error:`, err?.message ?? err)
    await new Promise((r) => setTimeout(r, 5000))
  }
}
