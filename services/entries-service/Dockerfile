FROM node:20-alpine

WORKDIR /app

COPY ./services/entries-service/package.json ./

RUN npm ci --production || npm install --production

COPY ./services/entries-service ./

COPY ./protos/ ./protos

CMD ["npm", "start"]