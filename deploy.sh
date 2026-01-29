#!/bin/bash

# PrimeCell API Deployment Script
# Run this script on your VPS after initial setup

set -e

echo "=========================================="
echo "  PrimeCell API Deployment Script"
echo "=========================================="

# Configuration
APP_DIR="/var/www/primecell"
API_DIR="$APP_DIR/apps/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a deploy user for production."
fi

# Navigate to API directory
cd "$API_DIR" || { print_error "API directory not found: $API_DIR"; exit 1; }

echo ""
echo "Step 1: Installing dependencies..."
npm install --legacy-peer-deps
print_status "Dependencies installed"

echo ""
echo "Step 2: Building the application..."
npm run build
print_status "Application built"

echo ""
echo "Step 3: Running database migrations..."
npx prisma migrate deploy
print_status "Migrations applied"

echo ""
echo "Step 4: Seeding database (if needed)..."
npx prisma db seed || print_warning "Seed skipped or already seeded"

echo ""
echo "Step 5: Starting/Restarting PM2..."
pm2 delete primecell-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
print_status "PM2 started"

echo ""
echo "Step 6: Checking application status..."
pm2 status

echo ""
echo "=========================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Your API should now be running at http://localhost:1997"
echo "Use 'pm2 logs primecell-api' to view logs"
echo ""
