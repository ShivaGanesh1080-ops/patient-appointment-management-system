# ==============================================================================
# MediPulse - Production Multi-Stage Dockerfile
# Lightweight, secure, non-root Node.js & SQLite container
# ==============================================================================

# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Add curl for container health check
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=5000

# Copy node modules and source code
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY src ./src
COPY public ./public
COPY data ./data

# Create dedicated persistent data directory with permissions
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
