# Vercel Deployment Scripts
# PowerShell scripts for easy deployment

Write-Host "=== NoteVault Backend Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Navigate to Backend directory
Set-Location "c:\Users\LENOVO\Videos\notes\Backend"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Ask for deployment type
$deployType = Read-Host "Deploy to (1) Preview or (2) Production? Enter 1 or 2"

if ($deployType -eq "2") {
    Write-Host "Deploying to PRODUCTION..." -ForegroundColor Yellow
    vercel --prod
} else {
    Write-Host "Deploying to PREVIEW..." -ForegroundColor Yellow
    vercel
}

Write-Host ""
Write-Host "Backend deployment complete!" -ForegroundColor Green
Write-Host "Don't forget to:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables in Vercel Dashboard" -ForegroundColor Yellow
Write-Host "2. Update VITE_API_URL in Frontend/.env.production with the deployed URL" -ForegroundColor Yellow
Write-Host "3. Deploy the frontend using deploy-frontend.ps1" -ForegroundColor Yellow
