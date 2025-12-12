#!/bin/bash

# Deploy TVTS API to Render
# This script helps automate the deployment process

set -e

echo "========================================="
echo "TVTS API - Render Deployment"
echo "========================================="
echo ""

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "render-deployment" ]; then
    echo "Warning: Not on render-deployment branch (currently on $CURRENT_BRANCH)"
    read -p "Switch to render-deployment branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout render-deployment
    fi
fi

# Check if render CLI is installed
if ! command -v /c/Users/samsung/bin/render.exe &> /dev/null; then
    echo "Error: Render CLI not found at /c/Users/samsung/bin/render.exe"
    exit 1
fi

# Check if logged in
echo "Checking Render authentication..."
RENDER_USER=$(/c/Users/samsung/bin/render.exe whoami --output json 2>/dev/null | grep -o '"email":"[^"]*"' | cut -d'"' -f4)

if [ -z "$RENDER_USER" ]; then
    echo "Not logged in to Render. Please run: render login"
    exit 1
fi

echo "Logged in as: $RENDER_USER"
echo ""

# Check for required environment variables
echo "Checking environment variables..."
if [ -f "../.env" ]; then
    source ../.env
    if [ -z "$TVWS_AUTH_TOKEN" ]; then
        echo "Warning: TVWS_AUTH_TOKEN not found in ../.env"
    else
        echo "Found TVWS_AUTH_TOKEN in ../.env"
    fi
else
    echo "Warning: ../.env file not found"
fi

echo ""
echo "========================================="
echo "Deployment Options"
echo "========================================="
echo ""
echo "The Render CLI doesn't support creating services from YAML."
echo "You have two options:"
echo ""
echo "1. Create service via Render Dashboard (Recommended)"
echo "   URL: https://dashboard.render.com/select-repo?type=blueprint"
echo ""
echo "2. I'll create the service manually for you"
echo ""

# Open browser to Render Blueprint page
read -p "Open Render dashboard in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening Render dashboard..."
    start "https://dashboard.render.com/select-repo?type=blueprint"
    echo ""
    echo "In the dashboard:"
    echo "1. Select repository: goer/tvts"
    echo "2. Select branch: render-deployment"
    echo "3. Render will auto-detect render.yaml"
    echo "4. Set environment variables:"
    echo "   - API_KEY = prod_tvts_api_key_12345_secure"
    if [ ! -z "$TVWS_AUTH_TOKEN" ]; then
        echo "   - TVWS_AUTH_TOKEN = $TVWS_AUTH_TOKEN"
    else
        echo "   - TVWS_AUTH_TOKEN = (get from ../.env)"
    fi
    echo "5. Click 'Apply'"
    echo ""
fi

# List existing services
echo "========================================="
echo "Existing Render Services"
echo "========================================="
/c/Users/samsung/bin/render.exe services --output json | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -10

echo ""
echo "After creating the service in the dashboard, you can manage it with:"
echo "  render services              # List all services"
echo "  render deploys create [ID]   # Trigger manual deploy"
echo "  render logs [ID]             # View logs"
echo ""
