FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npx prisma generate
RUN npm run build
RUN mkdir -p dist-server && npx esbuild server/index.ts --bundle --platform=node --target=node22 --format=esm --packages=external --outfile=dist-server/index.js
RUN npm prune --omit=dev --legacy-peer-deps

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

EXPOSE 3000
CMD ["node", "dist-server/index.js"]
