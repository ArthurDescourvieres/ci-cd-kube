FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

FROM base AS dev
RUN npm ci
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "dev"]


FROM base AS prod
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]