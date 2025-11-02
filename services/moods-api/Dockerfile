FROM node:20-alpine

WORKDIR /app

COPY ./services/moods-api/package.json ./

RUN npm ci --production || npm install --production

COPY ./services/moods-api ./

COPY ./protos/ ./protos

CMD ["npm", "start"]