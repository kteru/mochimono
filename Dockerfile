# =============================================================================
# Mochimono - Personal Items Memo App
# =============================================================================
#
# Web application for managing personal items.
# Uses Google account OAuth authentication and SQLite database.
#
# Environment Variables:
#   NEXTAUTH_URL          - Application base URL (required)
#   NEXTAUTH_SECRET       - NextAuth secret key (required)
#   GOOGLE_CLIENT_ID      - Google OAuth client ID (required)
#   GOOGLE_CLIENT_SECRET  - Google OAuth client secret (required)
#   DATABASE_URL          - Database URL (optional, default: file:/app/data/mochimono.db)
#
# Volumes:
#   /app/data             - SQLite database storage directory
#
# Ports:
#   3000                  - HTTP server
#
# Usage example:
#   docker run -d \
#     --name mochimono \
#     -p 3000:3000 \
#     -v ./data:/app/data \
#     -e NEXTAUTH_URL=http://localhost:3000 \
#     -e NEXTAUTH_SECRET=your-secret-key \
#     -e GOOGLE_CLIENT_ID=your-client-id \
#     -e GOOGLE_CLIENT_SECRET=your-client-secret \
#     mochimono
#
# =============================================================================

# Base image
FROM node:22-alpine AS base
LABEL maintainer="mochimono"
LABEL description="Personal Items Management App - Next.js + SQLite"

# Install required system packages
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Dependencies installation stage
FROM base AS deps

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Build stage
FROM base AS builder

# Install all dependencies including dev dependencies
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma Client and build application
RUN npx prisma generate && npm run build

# Production runtime stage
FROM base AS runner

# Production environment settings
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy all dependencies (including Prisma engines and CLI)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy script files
COPY --chown=nextjs:nodejs scripts/ ./scripts/
RUN chmod +x ./scripts/*.sh

# Copy entrypoint script
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create data directory
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Default environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/mochimono.db"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Define volume
VOLUME ["/app/data"]

# Start application
ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]
CMD ["node", "server.js"]