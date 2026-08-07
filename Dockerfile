# Syntax: docker/dockerfile:1
# Production deployment image for BodySignal.
#
# This Dockerfile produces a portable Node.js runtime image. It does NOT bake
# any environment-specific secrets into the image; all secrets are injected at
# runtime via the deployment platform's secret store / host environment.
#
# Build:   docker build -t bodysignal .
# Run:     docker run -p 3000:3000 --env-file .env bodysignal
#
# Hosting note: APP_URL, SUPABASE_*, STRIPE_*, GEMINI_API_KEY, NODE_ENV, PORT,
# DEV_PREMIUM must be supplied at runtime by the orchestration platform.

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (cached layer). Uses npm ci for reproducible installs
# from package-lock.json. Only production deps are needed at runtime.
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# Build stage: compile frontend + bundle server.
# Runs as a separate stage so build tooling never ships to the runtime image.
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: minimal image with only production deps + built artifacts.
# Runs as a non-root user for defense in depth.
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

USER node
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
