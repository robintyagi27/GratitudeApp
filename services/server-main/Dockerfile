FROM node:20-alpine

WORKDIR /app

COPY ./services/server-main/package.json ./

RUN npm ci --production || npm install --production

COPY ./services/server-main ./

CMD ["npm", "start"]