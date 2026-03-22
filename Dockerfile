FROM oven/bun:1-debian

WORKDIR /app

COPY . .

RUN bun install

COPY apps/web-app/.env.production apps/web-app/.env
RUN bun run --filter @cloudy/web-app build

RUN cp -r apps/web-app/dist public

EXPOSE 3000
CMD ["bun", "run", "apps/server/src/index.ts"]
