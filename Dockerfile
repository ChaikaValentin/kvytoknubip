FROM node:20-slim AS build
WORKDIR /app
COPY client/package*.json ./client/
RUN npm ci --prefix client
COPY client ./client
RUN npm run --prefix client build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm rebuild better-sqlite3
COPY server ./server
COPY --from=build /app/client/dist ./client/dist
EXPOSE 3000
CMD ["sh", "-c", "node server/seed.js && node server/index.js"]
