FROM node:20-alpine

WORKDIR /app

COPY ./services/moods-service/package.json ./

RUN npm ci --production || npm install --production

COPY ./services/moods-service ./

COPY ./protos/ ./protos

CMD ["npm", "start"]