FROM oven/bun:1-debian

WORKDIR /app

COPY . .

RUN bun install

RUN bun run --filter @cloudy/web-app build

RUN cp -r apps/web-app/dist public

EXPOSE 3000
CMD ["bun", "run", "apps/server/src/index.ts"]
