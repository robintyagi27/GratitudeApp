FROM node:20-alpine

WORKDIR /app

COPY ./services/stats-service/package.json ./

RUN npm ci --production || npm install --production

COPY ./services/stats-service ./

COPY ./protos/ ./protos

CMD ["npm", "start"]