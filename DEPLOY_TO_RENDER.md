# Quick Deploy to Render

## One-Click Deploy

Click the button below to deploy TVTS API to Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/select-repo?type=blueprint)

## Manual Steps

1. Go to: https://dashboard.render.com/select-repo?type=blueprint

2. Select repository: `goer/tvts`

3. Select branch: `render-deployment`

4. Render will detect `render.yaml` and configure automatically

5. Set required environment variables:
   - `API_KEY` = `prod_tvts_api_key_12345_secure`
   - `TVWS_AUTH_TOKEN` = (get from ../.env file)

6. Click "Apply"

## After Deployment

Your API will be live at: `https://tvts-api.onrender.com`

Test endpoints:
- Health: `https://tvts-api.onrender.com/api/health`
- Swagger: `https://tvts-api.onrender.com/api-docs`
- Price: `https://tvts-api.onrender.com/api/price?symbol=COINBASE:BTCUSD` (requires API key header)

## Current Status

- Branch: `render-deployment` ✅ Pushed to GitHub
- Configuration: `render.yaml` ✅ Created
- Build: `npm run build:api` ✅ Tested locally
- Server: WebSocket-compatible ✅ Fixed for traditional hosting

Ready to deploy!
