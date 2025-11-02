# GratitudeApp - Azure Kubernetes Service (AKS) Deployment

This directory contains all the necessary Kubernetes manifests and deployment scripts to deploy the GratitudeApp microservices architecture on Azure Kubernetes Service.

## Architecture Overview

The GratitudeApp consists of:
- **Frontend**: React application (served on port 80)
- **API Gateway**: Entry point for API requests (port 50050)
- **Entries Service**: Handles gratitude entries (port 50051)
- **Moods API**: Manages mood data (port 50052)
- **Stats API**: Provides statistics (port 50053)
- **Stats Service**: Backend stats processing (port 50054)
- **Moods Service**: Backend mood processing (port 50055)
- **Server Main**: Main server component (port 50056)
- **PostgreSQL**: Database (port 5432)

## Prerequisites

1. **Azure CLI** installed and configured
2. **kubectl** installed
3. **AKS Cluster** created and running
4. **Azure Container Registry** with all Docker images pushed
5. **NGINX Ingress Controller** (will be installed automatically)

## Docker Images

All images are hosted in Azure Container Registry:
- `pranshub11gratitudeapp.azurecr.io/grat-frontend:latest`
- `pranshub11gratitudeapp.azurecr.io/grat-api-gateway:latest`
- `pranshub11gratitudeapp.azurecr.io/grat-entries-service:latest`
- `pranshub11gratitudeapp.azurecr.io/grat-moods-api:latest`
- `pranshub11gratitudeapp.azurecr.io/grat-stats-api:latest`
- `pranshub11gratitudeapp.azurecr.io/grat-stats-service:latest`
- `pranshub11gratitudeapp.azurecr.io/grat-moods-service:latest`
- `pranshub11gratitudeapp.azurecr.io/grat-server-main:latest`

## Quick Start

### 1. Configure the Deployment Script

Edit the `deploy.sh` script and set your AKS cluster details:

```bash
RESOURCE_GROUP="your-resource-group"
AKS_CLUSTER="your-aks-cluster-name"
```

### 2. Deploy the Application

```bash
# Make the script executable
chmod +x deploy.sh

# Deploy everything
./deploy.sh deploy
```

### 3. Check Status

```bash
# Get application status and URLs
./deploy.sh status
```

### 4. Clean Up (if needed)

```bash
# Remove all resources
./deploy.sh cleanup
```

## Manual Deployment

If you prefer manual deployment, apply the manifests in this order:

```bash
# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Apply configuration
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# 3. Deploy PostgreSQL
kubectl apply -f postgres.yaml

# 4. Deploy Services
kubectl apply -f services.yaml

# 5. Deploy Applications
kubectl apply -f deployments-api-gateway-entries.yaml
kubectl apply -f deployments-moods-stats-api.yaml
kubectl apply -f deployments-stats-moods-service.yaml
kubectl apply -f deployments-server-main-frontend.yaml

# 6. Deploy Ingress
kubectl apply -f ingress.yaml
```

## API Routing

The NGINX Ingress Controller handles routing based on URL paths:

- **Frontend**: `/` → `grat-frontend-service:80`
- **API Gateway**: `/api/gateway` → `grat-api-gateway-service:50050`
- **Entries Service**: `/api/entries` → `grat-entries-service-service:50051`
- **Moods API**: `/api/moods` → `grat-moods-api-service:50052`
- **Stats API**: `/api/stats` → `grat-stats-api-service:50053`
- **Server Main**: `/api/server` → `grat-server-main-service:50056`

## Configuration

### Environment Variables

All services use environment variables from ConfigMap and Secrets:

**ConfigMap (`gratitude-config`)**:
- Database connection details
- Service ports
- Non-sensitive configuration

**Secrets (`gratitude-secrets`)**:
- Database passwords
- Sensitive configuration

### Resource Limits

Each service has resource requests and limits configured:
- **CPU**: 50m-200m requests, 100m-500m limits
- **Memory**: 64Mi-256Mi requests, 128Mi-512Mi limits

### Health Checks

All services include:
- **Liveness Probe**: Checks if the service is running
- **Readiness Probe**: Checks if the service is ready to accept traffic

## Monitoring and Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n gratitude-app
```

### Check Service Status
```bash
kubectl get services -n gratitude-app
```

### Check Ingress Status
```bash
kubectl get ingress -n gratitude-app
```

### View Logs
```bash
# View logs for a specific pod
kubectl logs -n gratitude-app <pod-name>

# View logs for all pods in a deployment
kubectl logs -n gratitude-app deployment/<deployment-name>
```

### Get External IP
```bash
kubectl get service -n ingress-nginx ingress-nginx-controller
```

## Scaling

To scale any service:

```bash
# Scale a deployment
kubectl scale deployment <deployment-name> --replicas=3 -n gratitude-app

# Example: Scale frontend to 3 replicas
kubectl scale deployment grat-frontend --replicas=3 -n gratitude-app
```

## Security Considerations

1. **Secrets**: Database passwords are stored in Kubernetes secrets
2. **Network Policies**: Consider implementing network policies for additional security
3. **RBAC**: Configure proper role-based access control
4. **TLS**: Enable TLS termination at the ingress level for production

## Production Recommendations

1. **Enable TLS**: Configure SSL certificates for HTTPS
2. **Resource Monitoring**: Set up monitoring and alerting
3. **Backup Strategy**: Implement database backup strategy
4. **Logging**: Set up centralized logging
5. **Security Scanning**: Regular security scans of container images

## Troubleshooting Common Issues

### Pods Not Starting
- Check resource limits and requests
- Verify image names and tags
- Check environment variables

### Database Connection Issues
- Ensure PostgreSQL pod is running
- Check database credentials in secrets
- Verify network connectivity

### Ingress Not Working
- Check NGINX Ingress Controller status
- Verify ingress rules and paths
- Check external IP assignment

### Frontend Not Loading
- Check if frontend pod is running
- Verify ingress routing rules
- Check browser console for errors

## Support

For issues or questions:
1. Check the logs using `kubectl logs`
2. Verify all pods are running with `kubectl get pods`
3. Check service endpoints with `kubectl get endpoints`
4. Review ingress configuration with `kubectl describe ingress`
