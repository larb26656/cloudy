FROM oven/bun:1-debian

WORKDIR /app

ENV NODE_ENV=production

COPY . .

RUN bun install
RUN bun run cloudy:link

EXPOSE 3000
CMD ["bun", "run", "cloudy", "serve"]
