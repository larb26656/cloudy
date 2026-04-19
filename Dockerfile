FROM oven/bun:1-debian

WORKDIR /app

ENV NODE_ENV=production

COPY . .

RUN bun install
RUN bun run cloudy:build

EXPOSE 3000
CMD ["bun", "run", "apps/server/dist/cli.js", "serve"]
