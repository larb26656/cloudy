FROM oven/bun:1-debian

WORKDIR /app

COPY . .

RUN chmod +x scripts/build-frontend.sh
RUN bun install
RUN ./scripts/build-frontend.sh

EXPOSE 3000
CMD ["cloudy", "serve", "--ui"]
