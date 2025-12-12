# Render Deployment Guide for TVTS API

## Prerequisites

- Git repository pushed to GitHub: ✅ `https://github.com/goer/tvts` (render-deployment branch)
- Render account: ✅ Logged in as fonetix@gmail.com
- render.yaml configuration: ✅ Created

## Deployment Steps

### Option 1: Deploy via Render Dashboard (Recommended)

1. **Open Render Dashboard**
   - Go to: https://dashboard.render.com/

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"

3. **Connect Repository**
   - Select "Connect a repository"
   - Choose: `goer/tvts`
   - Branch: `render-deployment`

4. **Configure Service** (Render will auto-detect render.yaml)
   - Name: `tvts-api`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build:api`
   - Start Command: `npm run start:api`
   - Plan: `Free`

5. **Set Environment Variables**
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (auto-set by Render)
   - `API_KEY` = `your_api_key_here` (REQUIRED)
   - `TVWS_AUTH_TOKEN` = `your_tradingview_token_here` (REQUIRED)

6. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment (~3-5 minutes)

### Option 2: Deploy via Render CLI

Since the Render CLI doesn't support creating services directly, use the dashboard method above.

## Environment Variables Required

You need to set these in the Render dashboard:

```bash
API_KEY=prod_tvts_api_key_12345_secure
TVWS_AUTH_TOKEN=eyJhbGciOiJSUzUxMi...
```

## After Deployment

Your API will be available at:
- Production URL: `https://tvts-api.onrender.com`
- Swagger UI: `https://tvts-api.onrender.com/api-docs`
- Health check: `https://tvts-api.onrender.com/api/health`

## Testing the Deployed API

```bash
# Test health endpoint
curl https://tvts-api.onrender.com/api/health

# Test price endpoint (with API key)
curl -H "X-API-Key: your_api_key" "https://tvts-api.onrender.com/api/price?symbol=COINBASE:BTCUSD"

# Test in browser
# Open: https://tvts-api.onrender.com/api-docs
```

## Why Render Instead of Vercel?

- ✅ **WebSocket Support**: Render supports persistent WebSocket connections
- ✅ **Long-running Processes**: No 10-second timeout limitation
- ✅ **Traditional Hosting**: Server stays alive, perfect for TVTS library
- ❌ Vercel: Serverless functions don't support WebSockets

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure `npm run build:api` works locally first
- Verify all dependencies are in package.json

### Service Won't Start
- Check environment variables are set correctly
- Verify TVWS_AUTH_TOKEN is valid
- Check logs: `render logs -f srv-xxxxx`

### API Returns 500 Error
- Check WebSocket connection status in logs
- Verify TradingView token is not expired
- Test locally first: `npm run dev:api`

## Manual Deployment Commands

If you need to trigger a manual deploy after the service is created:

```bash
# List services to get service ID
render services --output json | grep "tvts-api"

# Trigger deploy
render deploys create srv-xxxxxxxx --wait
```

## Updating the Deployment

To update after making changes:

```bash
# 1. Commit changes
git add .
git commit -m "Update API"

# 2. Push to GitHub
git push origin render-deployment

# 3. Render auto-deploys on push (if auto-deploy is enabled)
# Or manually trigger: render deploys create srv-xxxxxxxx
```
