#!/usr/bin/env bash
# Runs ON the EC2 instance. Expects AWS_REGION, REGISTRY, REPOSITORY, DEPLOY_DIR
# to already be set in the environment (the caller passes them in).
set -e

echo "Starting deployment process..."
export DEBIAN_FRONTEND=noninteractive

# Install dependencies
if command -v apt-get &> /dev/null; then
  sudo apt-get update -qq || true
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl unzip 2>/dev/null || true
fi

# Install AWS CLI v2 if missing
if ! command -v aws &> /dev/null; then
  echo "Installing AWS CLI v2..."
  cd /tmp
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip -q awscliv2.zip
  sudo ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update
  rm -rf awscliv2.zip aws
fi

# No AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are set here on purpose --
# the instance's attached IAM role provides these credentials automatically
# via the EC2 metadata service.
echo "Verifying instance role credentials..."
aws sts get-caller-identity || {
  echo "Error: no usable AWS credentials found. Confirm an IAM role"
  echo "with AmazonEC2ContainerRegistryReadOnly is attached to this instance."
  exit 1
}

echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"

echo "Pulling latest Docker images from ECR..."
for svc in auth-service customer-service account-service transaction-service notification-service frontend; do
  docker pull "$REGISTRY/$REPOSITORY:${svc}-latest" || true
done

if [ ! -f "$DEPLOY_DIR/docker-compose.yml" ]; then
  echo "Error: $DEPLOY_DIR/docker-compose.yml not found. Did the copy step run?"
  exit 1
fi
cd "$DEPLOY_DIR"

echo "Stopping existing containers..."
docker compose down || true

cp docker-compose.yml docker-compose.yml.backup

echo "Updating docker-compose.yml with new image tags..."
sed -i "s|image: .*auth-service:.*|image: $REGISTRY/$REPOSITORY:auth-service-latest|g" docker-compose.yml
sed -i "s|image: .*customer-service:.*|image: $REGISTRY/$REPOSITORY:customer-service-latest|g" docker-compose.yml
sed -i "s|image: .*account-service:.*|image: $REGISTRY/$REPOSITORY:account-service-latest|g" docker-compose.yml
sed -i "s|image: .*transaction-service:.*|image: $REGISTRY/$REPOSITORY:transaction-service-latest|g" docker-compose.yml
sed -i "s|image: .*notification-service:.*|image: $REGISTRY/$REPOSITORY:notification-service-latest|g" docker-compose.yml
sed -i "s|image: .*frontend:.*|image: $REGISTRY/$REPOSITORY:frontend-latest|g" docker-compose.yml

if [ -f "$DEPLOY_DIR/.env" ]; then
  echo "Loading environment variables from .env..."
  set -a
  source "$DEPLOY_DIR/.env"
  set +a
fi

echo "Starting new containers..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d

echo "Deployment completed successfully"
