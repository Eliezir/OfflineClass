# syntax=docker/dockerfile:1.7

# ---- Build stage ----------------------------------------------------------
# O backend é construído como pacote standalone (fora do workspace pnpm) para
# que o contexto de build seja apenas ./backend, sem depender do lockfile raiz.
FROM node:22-slim AS build

# openssl é exigido pelos engines do Prisma (detecção de libssl).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# Instala dependências primeiro (camada cacheável). O postinstall roda
# `prisma generate`, por isso o schema precisa estar presente aqui.
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

# ---- Runtime stage --------------------------------------------------------
FROM node:22-slim AS runtime

# openssl é exigido pelos engines do Prisma em runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    DATABASE_URL="file:/app/database/apresenta-ia.db"

# Usuário não-root
RUN groupadd --system app && useradd --system --gid app --home /app app

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=app:app /app/src ./src

RUN mkdir -p /app/database && chown -R app:app /app/database

USER app

EXPOSE 8080

# O arquivo SQLite persiste entre reinícios quando /app/database é um volume.
VOLUME ["/app/database"]

# Aplica as migrations e sobe o servidor (tsx executa o TypeScript direto).
# Chama os binários direto do node_modules para não depender de pnpm/corepack
# em runtime (evita download/cache do corepack como usuário não-root).
ENTRYPOINT ["sh", "-c", "node_modules/.bin/prisma generate && node_modules/.bin/prisma migrate deploy && node_modules/.bin/prisma db seed && exec node_modules/.bin/tsx src/main.ts"]
