FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY . .

RUN npm install

RUN npm run cloudy:build

EXPOSE 3000

CMD ["node", "apps/server/dist/cli.js", "serve"]