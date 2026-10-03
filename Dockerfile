FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci \
    && npm install --no-save \
        lightningcss-linux-x64-gnu \
        @tailwindcss/oxide-linux-x64-gnu


FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir -p .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /app/storage/videos
RUN chown -R nextjs:nodejs /app/storage

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
