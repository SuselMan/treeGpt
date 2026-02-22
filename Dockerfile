# Stage 1: build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: backend
FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=backend /app/package*.json ./
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/dist ./dist
COPY --from=frontend /app/dist ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
