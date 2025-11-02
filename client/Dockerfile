FROM node:20-alpine AS build

WORKDIR /app

COPY ./client/package.json ./

RUN npm ci --production || npm install --production

COPY ./client ./

RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80