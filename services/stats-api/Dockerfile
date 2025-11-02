FROM node:20-alpine

WORKDIR /app

COPY ./services/stats-api/package.json ./

RUN npm ci --production || npm install --production

COPY ./services/stats-api ./

COPY ./protos/ ./protos

CMD ["npm", "start"]