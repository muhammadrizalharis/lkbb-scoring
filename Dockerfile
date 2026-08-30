# syntax=docker/dockerfile:1
# Image aplikasi Next.js (standalone). Semua dependency pure-JS + Prisma query
# compiler (WASM) → tidak butuh engine native/openssl, aman di Alpine.

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: install seluruh dependency (termasuk dev untuk build) ----
FROM base AS deps
COPY package.json package-lock.json ./
# --ignore-scripts: cegah postinstall `prisma generate` jalan sebelum schema ada.
RUN npm ci --ignore-scripts

# ---- build: generate Prisma client (WASM) + next build (standalone) ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholder saat build; TIDAK dipakai runtime & tak konek DB (halaman force-dynamic).
ENV NODE_ENV=production \
    DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
    AUTH_SECRET="build-time-placeholder"
RUN npx prisma generate && npm run build

# ---- runner: image runtime ramping ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# Bundel standalone + aset statis + publik.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Pastikan Prisma client + WASM query compiler ikut (kadang tak ter-trace standalone).
COPY --from=build /app/src/generated ./src/generated

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
