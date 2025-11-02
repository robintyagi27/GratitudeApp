#!/bin/bash

# GratitudeApp AKS Deployment Script
# This script deploys the GratitudeApp microservices to Azure Kubernetes Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="gratitude-app"
RESOURCE_GROUP="DevopsB11"
AKS_CLUSTER="pranshuGratitudeApp"
ACR_NAME="pranshub11gratitudeapp"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if kubectl is installed and configured
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install Azure CLI first."
        exit 1
    fi
    
    # Check if kubectl is configured
    if ! kubectl cluster-info &> /dev/null; then
        print_error "kubectl is not configured. Please configure kubectl to connect to your AKS cluster."
        print_status "Run: az aks get-credentials --resource-group <RESOURCE_GROUP> --name <CLUSTER_NAME>"
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
}

# Function to get AKS credentials
get_aks_credentials() {
    if [ -z "$RESOURCE_GROUP" ] || [ -z "$AKS_CLUSTER" ]; then
        print_error "Please set RESOURCE_GROUP and AKS_CLUSTER variables in the script"
        exit 1
    fi
    
    print_status "Getting AKS credentials..."
    az aks get-credentials --resource-group "$RESOURCE_GROUP" --name "$AKS_CLUSTER" --overwrite-existing
    print_success "AKS credentials configured!"
}

# Function to install NGINX Ingress Controller
install_nginx_ingress() {
    print_status "Installing NGINX Ingress Controller..."
    
    # Check if NGINX ingress is already installed
    if kubectl get pods -n ingress-nginx | grep -q "ingress-nginx-controller"; then
        print_warning "NGINX Ingress Controller already installed"
        return
    fi
    
    # Install NGINX Ingress Controller
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
    
    # Wait for ingress controller to be ready
    print_status "Waiting for NGINX Ingress Controller to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    print_success "NGINX Ingress Controller installed!"
}

# Function to deploy the application
deploy_application() {
    print_status "Deploying GratitudeApp to AKS..."
    
    # Create namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Apply ConfigMap and Secrets
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    
    # Deploy PostgreSQL
    print_status "Deploying PostgreSQL..."
    kubectl apply -f k8s/postgres.yaml
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=grat-postgres -n "$NAMESPACE" --timeout=300s
    
    # Deploy Services
    print_status "Deploying Services..."
    kubectl apply -f k8s/services.yaml
    
    # Deploy Applications
    print_status "Deploying Microservices..."
    kubectl apply -f k8s/deployments-api-gateway-entries.yaml
    kubectl apply -f k8s/deployments-moods-stats-api.yaml
    kubectl apply -f k8s/deployments-stats-moods-service.yaml
    kubectl apply -f k8s/deployments-server-main-frontend.yaml
    
    # Wait for deployments to be ready
    print_status "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available deployment --all -n "$NAMESPACE" --timeout=600s
    
    # Deploy Ingress
    print_status "Deploying Ingress..."
    kubectl apply -f k8s/ingress.yaml
    
    print_success "GratitudeApp deployed successfully!"
}

# Function to get application status
get_status() {
    print_status "Getting application status..."
    
    echo ""
    echo "=== Namespace Status ==="
    kubectl get namespace "$NAMESPACE"
    
    echo ""
    echo "=== Pods Status ==="
    kubectl get pods -n "$NAMESPACE"
    
    echo ""
    echo "=== Services Status ==="
    kubectl get services -n "$NAMESPACE"
    
    echo ""
    echo "=== Ingress Status ==="
    kubectl get ingress -n "$NAMESPACE"
    
    echo ""
    echo "=== Deployment Status ==="
    kubectl get deployments -n "$NAMESPACE"
}

# Function to get application URLs
get_urls() {
    print_status "Getting application URLs..."
    
    # Get external IP of ingress controller
    EXTERNAL_IP=$(kubectl get service -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$EXTERNAL_IP" ]; then
        print_warning "External IP not available yet. Run 'kubectl get service -n ingress-nginx ingress-nginx-controller' to check status."
        return
    fi
    
    echo ""
    echo "=== Application URLs ==="
    echo "Frontend: http://$EXTERNAL_IP"
    echo "API Gateway: http://$EXTERNAL_IP/api/gateway"
    echo "Entries Service: http://$EXTERNAL_IP/api/entries"
    echo "Moods API: http://$EXTERNAL_IP/api/moods"
    echo "Stats API: http://$EXTERNAL_IP/api/stats"
    echo "Server Main: http://$EXTERNAL_IP/api/server"
    echo ""
}

# Function to clean up resources
cleanup() {
    print_warning "This will delete all GratitudeApp resources. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up GratitudeApp resources..."
        kubectl delete namespace "$NAMESPACE"
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Main function
main() {
    echo "=========================================="
    echo "    GratitudeApp AKS Deployment Script    "
    echo "=========================================="
    echo ""
    
    case "${1:-deploy}" in
        "deploy")
            get_aks_credentials
            check_prerequisites
            install_nginx_ingress
            deploy_application
            get_status
            get_urls
            ;;
        "status")
            get_status
            get_urls
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [deploy|status|cleanup|help]"
            echo ""
            echo "Commands:"
            echo "  deploy  - Deploy the GratitudeApp to AKS (default)"
            echo "  status  - Show application status and URLs"
            echo "  cleanup - Remove all GratitudeApp resources"
            echo "  help    - Show this help message"
            echo ""
            echo "Before running, make sure to:"
            echo "1. Set RESOURCE_GROUP and AKS_CLUSTER variables in this script"
            echo "2. Configure kubectl to connect to your AKS cluster"
            echo "3. Ensure your Docker images are pushed to Azure Container Registry"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
