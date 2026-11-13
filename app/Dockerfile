FROM node:20-alpine AS base
RUN npm install -g pnpm@latest

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "pnpm preview --port ${PORT:-3000} --host 0.0.0.0"]
