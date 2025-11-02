# GratitudeApp

Contains of a React application and multiple nodejs services, relying on gRPC for internal communications & powered by postgreSQL Database.

## Services:
- Api Gateway
    Repository/Docker Image: pranshub11gratitudeapp.azurecr.io/grat-api-gateway:latest
- Entries Service
    Repository/Docker Image: pranshub11gratitudeapp.azurecr.io/grat-entries-service:latest
- Moods API
    Repository/Docker Image: pranshub11gratitudeapp.azurecr.io/grat-moods-api:latest
- Moods Service
    Repository/Docker Image: pranshub11gratitudeapp.azurecr.io/grat-moods-service:latest
- Stats API
    Repository/Docker Image: pranshub11gratitudeapp.azurecr.io/grat-stats-api:latest
- Stats Service
    Repository/Docker Image: pranshub11gratitudeapp.azurecr.io/grat-stats-service:latest
- Server Main
    Repository/Docker Image: pranshub11gratitudeapp.azurecr.io/grat-server-main:latest
- Client: React application: It connects to multiple backend services hosted on same host.
    Depends on:
        entries-service
        stats-api
        moods-api
        server-main
    Frontend calls all backend apis with prefix: "/api" before the route.
    Repository/Docker Image: pranshub11gratitudeapp.azurecr.io/grat-frontend:latest