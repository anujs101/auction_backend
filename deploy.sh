#!/bin/bash

# Production deployment script for Solana Energy Auction Backend
set -e

echo "🚀 Starting production deployment..."

# Check if required environment variables are set
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Error: POSTGRES_PASSWORD environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET environment variable is required"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is required"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🗄️ Starting database..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm app bun run prisma:deploy

echo "🌱 Seeding database..."
docker-compose -f docker-compose.prod.yml run --rm app bun run prisma:seed

echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment complete!"
echo "🌐 Application is running at https://localhost"
echo "📊 Health check: https://localhost/health"

# Show running containers
docker-compose -f docker-compose.prod.yml ps
