# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies to keep image size small
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Expose port (Render automatically maps the PORT environment variable)
EXPOSE 5000

# Start application
CMD ["npm", "run", "start:prod"]
