// Membuat ikon PWA (192/512/maskable) dari public/logo-mark.png.
// Jalankan: node scripts/gen-pwa-icons.mjs
import sharp from 'sharp'

const BG = { r: 11, g: 18, b: 32, alpha: 1 } // #0b1220 (navy brand)

async function make(size, ratio, out) {
  const box = Math.round(size * ratio)
  const logo = await sharp('public/logo-mark.png')
    .resize({ width: box, height: box, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(out)
  console.log('  ✓', out)
}

await make(192, 0.72, 'public/icon-192.png')
await make(512, 0.72, 'public/icon-512.png')
await make(512, 0.58, 'public/icon-maskable-512.png') // padding lebih utk safe-zone maskable
