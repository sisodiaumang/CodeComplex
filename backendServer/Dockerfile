# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN apk add --no-cache g++ openjdk17-jdk python3 && npm ci --omit=dev


# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Copy seed json files and db folder (required for DB seed scripts)
COPY --from=builder /app/src/db ./src/db

# Ensure temporary upload directory exists
RUN mkdir -p public/temp

EXPOSE 8000

CMD ["npm", "start"]
