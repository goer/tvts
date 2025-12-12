# PowerShell script to create Render service via API
# Render API documentation: https://api-docs.render.com/

param(
    [string]$ApiKey = ""
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "TVTS API - Render Service Creation" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if API key is provided
if ([string]::IsNullOrEmpty($ApiKey)) {
    Write-Host "Error: Render API key required" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your API key:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://dashboard.render.com/u/settings#api-keys" -ForegroundColor Yellow
    Write-Host "2. Create a new API key" -ForegroundColor Yellow
    Write-Host "3. Run: .\create-render-service.ps1 -ApiKey 'your-api-key'" -ForegroundColor Yellow
    Write-Host ""

    # Alternative: Open dashboard
    $response = Read-Host "Open Render dashboard instead? (y/n)"
    if ($response -eq "y") {
        Start-Process "https://dashboard.render.com/select-repo?type=blueprint"
        Write-Host ""
        Write-Host "Follow these steps in the dashboard:" -ForegroundColor Green
        Write-Host "1. Select repository: goer/tvts" -ForegroundColor White
        Write-Host "2. Select branch: render-deployment" -ForegroundColor White
        Write-Host "3. Render will auto-detect render.yaml" -ForegroundColor White
        Write-Host "4. Set environment variables:" -ForegroundColor White
        Write-Host "   - API_KEY = prod_tvts_api_key_12345_secure" -ForegroundColor White
        Write-Host "   - TVWS_AUTH_TOKEN = (from .env file)" -ForegroundColor White
        Write-Host "5. Click 'Apply'" -ForegroundColor White
    }
    exit
}

Write-Host "Creating Render service via API..." -ForegroundColor Green
Write-Host ""

# Service configuration from render.yaml
$serviceConfig = @{
    type = "web_service"
    name = "tvts-api"
    runtime = "node"
    plan = "free"
    repo = "https://github.com/goer/tvts"
    branch = "render-deployment"
    buildCommand = "npm install && npm run build:api"
    startCommand = "npm run start:api"
    healthCheckPath = "/api/health"
    envVars = @(
        @{ key = "NODE_ENV"; value = "production" }
        @{ key = "PORT"; value = "10000" }
    )
}

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

$body = $serviceConfig | ConvertTo-Json -Depth 10

try {
    Write-Host "Sending request to Render API..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Method Post -Headers $headers -Body $body

    Write-Host ""
    Write-Host "Service created successfully!" -ForegroundColor Green
    Write-Host "Service ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Service URL: $($response.serviceDetails.url)" -ForegroundColor Cyan
    Write-Host "Dashboard: https://dashboard.render.com/web/$($response.id)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to the dashboard and add environment variables:" -ForegroundColor White
    Write-Host "   - API_KEY" -ForegroundColor White
    Write-Host "   - TVWS_AUTH_TOKEN" -ForegroundColor White
    Write-Host "2. Wait for deployment to complete" -ForegroundColor White
    Write-Host "3. Test: curl https://$($response.serviceDetails.url)/api/health" -ForegroundColor White

} catch {
    Write-Host ""
    Write-Host "Error creating service via API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use the Render dashboard" -ForegroundColor Yellow
    Write-Host "URL: https://dashboard.render.com/select-repo?type=blueprint" -ForegroundColor Cyan
}
