# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production || \
    (if [ -f package-lock.json ]; then npm ci --production; else npm install --production; fi)

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "src/server.js"]
