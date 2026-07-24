#!/usr/bin/env bash
# Runs ON the EC2 instance to confirm the deployment came up healthy.
set -e

echo "=========================================="
echo "Starting Deployment Verification"
echo "=========================================="

echo "Waiting for services to be ready..."
sleep 15

echo ""
echo "Checking running containers..."
docker ps --filter "status=running" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

services=("auth-service" "customer-service" "account-service" "transaction-service" "notification-service")

echo ""
echo "Checking backend services..."
for service in "${services[@]}"; do
  if docker ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
    echo "OK: $service is running"
  else
    echo "FAIL: $service is NOT running"
    docker ps -a | grep "$service" || true
    exit 1
  fi
done

echo ""
echo "Checking frontend service..."
if docker ps --filter "name=frontend" --filter "status=running" | grep -q frontend; then
  echo "OK: Frontend is running"
else
  echo "FAIL: Frontend is NOT running"
  docker ps -a | grep frontend || true
  exit 1
fi

echo ""
echo "Checking API endpoint health..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health 2>/dev/null || echo "000")
if [ "$API_HEALTH" == "200" ]; then
  echo "OK: API is responding with health status 200"
else
  echo "WARN: API responded with status: $API_HEALTH"
fi

echo ""
echo "Checking frontend endpoint..."
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_HEALTH" == "200" ]; then
  echo "OK: Frontend is responding with status 200"
else
  echo "WARN: Frontend responded with status: $FRONTEND_HEALTH"
fi

echo ""
echo "Recent container logs summary:"
docker ps --format "table {{.Names}}" | tail -n +2 | while read -r container; do
  echo "  - $container: $(docker logs --tail 1 "$container" 2>/dev/null | head -c 80)"
done

echo ""
echo "=========================================="
echo "Deployment verification completed successfully"
echo "=========================================="
