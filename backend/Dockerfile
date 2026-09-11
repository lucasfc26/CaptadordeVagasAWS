# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# argon2 compiles a native addon on install; python3/make/g++ are only needed
# in these two build-time stages and are never copied into the final image.
FROM base AS native-build-tools
RUN apk add --no-cache python3 make g++

# ---------------------------------------------------------------------------
FROM native-build-tools AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
FROM native-build-tools AS deps-prod
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------------------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
