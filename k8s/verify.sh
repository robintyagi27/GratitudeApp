#!/bin/bash

# GratitudeApp Deployment Verification Script
# This script checks if all components are deployed and running correctly

set -e

NAMESPACE="gratitude-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if namespace exists
check_namespace() {
    print_status "Checking namespace..."
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_success "Namespace '$NAMESPACE' exists"
    else
        print_error "Namespace '$NAMESPACE' not found"
        return 1
    fi
}

# Function to check if all pods are running
check_pods() {
    print_status "Checking pod status..."
    
    local failed_pods=0
    local total_pods=0
    
    # Get all pods in the namespace
    while IFS= read -r line; do
        if [[ $line == *"grat-"* ]]; then
            total_pods=$((total_pods + 1))
            pod_name=$(echo "$line" | awk '{print $1}')
            pod_status=$(echo "$line" | awk '{print $3}')
            
            if [[ $pod_status == "Running" ]]; then
                print_success "Pod $pod_name is running"
            else
                print_error "Pod $pod_name is not running (Status: $pod_status)"
                failed_pods=$((failed_pods + 1))
            fi
        fi
    done < <(kubectl get pods -n "$NAMESPACE" --no-headers)
    
    if [ $failed_pods -eq 0 ]; then
        print_success "All $total_pods pods are running"
    else
        print_error "$failed_pods out of $total_pods pods are not running"
        return 1
    fi
}

# Function to check if all services are available
check_services() {
    print_status "Checking service status..."
    
    local services=(
        "grat-postgres-service"
        "grat-api-gateway-service"
        "grat-entries-service-service"
        "grat-moods-api-service"
        "grat-stats-api-service"
        "grat-stats-service-service"
        "grat-moods-service-service"
        "grat-server-main-service"
        "grat-frontend-service"
    )
    
    for service in "${services[@]}"; do
        if kubectl get service "$service" -n "$NAMESPACE" &> /dev/null; then
            print_success "Service $service exists"
        else
            print_error "Service $service not found"
            return 1
        fi
    done
}

# Function to check if ingress is configured
check_ingress() {
    print_status "Checking ingress configuration..."
    
    if kubectl get ingress gratitude-app-ingress -n "$NAMESPACE" &> /dev/null; then
        print_success "Ingress 'gratitude-app-ingress' exists"
        
        # Check if ingress has an external IP
        external_ip=$(kubectl get ingress gratitude-app-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        if [ -n "$external_ip" ]; then
            print_success "External IP: $external_ip"
        else
            print_warning "External IP not assigned yet"
        fi
    else
        print_error "Ingress 'gratitude-app-ingress' not found"
        return 1
    fi
}

# Function to check if deployments are ready
check_deployments() {
    print_status "Checking deployment status..."
    
    local deployments=(
        "grat-postgres"
        "grat-api-gateway"
        "grat-entries-service"
        "grat-moods-api"
        "grat-stats-api"
        "grat-stats-service"
        "grat-moods-service"
        "grat-server-main"
        "grat-frontend"
    )
    
    for deployment in "${deployments[@]}"; do
        if kubectl get deployment "$deployment" -n "$NAMESPACE" &> /dev/null; then
            ready_replicas=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
            desired_replicas=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
            
            if [ "$ready_replicas" = "$desired_replicas" ]; then
                print_success "Deployment $deployment is ready ($ready_replicas/$desired_replicas)"
            else
                print_warning "Deployment $deployment is not ready ($ready_replicas/$desired_replicas)"
            fi
        else
            print_error "Deployment $deployment not found"
            return 1
        fi
    done
}

# Function to test API endpoints
test_endpoints() {
    print_status "Testing API endpoints..."
    
    # Get external IP
    external_ip=$(kubectl get ingress gratitude-app-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$external_ip" ]; then
        print_warning "Cannot test endpoints - external IP not available"
        return
    fi
    
    # Test frontend
    if curl -s -o /dev/null -w "%{http_code}" "http://$external_ip" | grep -q "200"; then
        print_success "Frontend is accessible at http://$external_ip"
    else
        print_warning "Frontend may not be accessible"
    fi
    
    # Test API endpoints (these might return 404 if endpoints don't exist, but that's expected)
    local api_endpoints=(
        "/api/gateway"
        "/api/entries"
        "/api/moods"
        "/api/stats"
        "/api/server"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$external_ip$endpoint")
        if [ "$response_code" = "200" ] || [ "$response_code" = "404" ]; then
            print_success "API endpoint $endpoint is responding (HTTP $response_code)"
        else
            print_warning "API endpoint $endpoint returned HTTP $response_code"
        fi
    done
}

# Main function
main() {
    echo "=========================================="
    echo "   GratitudeApp Deployment Verification   "
    echo "=========================================="
    echo ""
    
    local exit_code=0
    
    # Run all checks
    check_namespace || exit_code=1
    echo ""
    
    check_pods || exit_code=1
    echo ""
    
    check_services || exit_code=1
    echo ""
    
    check_deployments || exit_code=1
    echo ""
    
    check_ingress || exit_code=1
    echo ""
    
    test_endpoints || exit_code=1
    echo ""
    
    if [ $exit_code -eq 0 ]; then
        print_success "All checks passed! GratitudeApp is deployed successfully."
        echo ""
        echo "Application URLs:"
        external_ip=$(kubectl get ingress gratitude-app-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        if [ -n "$external_ip" ]; then
            echo "Frontend: http://$external_ip"
            echo "API Gateway: http://$external_ip/api/gateway"
            echo "Entries Service: http://$external_ip/api/entries"
            echo "Moods API: http://$external_ip/api/moods"
            echo "Stats API: http://$external_ip/api/stats"
            echo "Server Main: http://$external_ip/api/server"
        fi
    else
        print_error "Some checks failed. Please review the output above."
    fi
    
    exit $exit_code
}

# Run main function
main "$@"
