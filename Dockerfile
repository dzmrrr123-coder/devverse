FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY app/package.json app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY app/ .
RUN pnpm build

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "pnpm preview --port ${PORT:-3000} --host 0.0.0.0"]
