FROM node:20-alpine

WORKDIR /app

COPY ./services/api-gateway/package.json ./

RUN npm ci --production || npm install --production

COPY ./services/api-gateway ./

COPY ./protos/ ./protos

CMD ["npm", "start"]