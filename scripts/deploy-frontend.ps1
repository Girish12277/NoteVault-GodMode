# Vercel Frontend Deployment Script
# PowerShell script for easy frontend deployment

Write-Host "=== NoteVault Frontend Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Navigate to Frontend directory
Set-Location "c:\Users\LENOVO\Videos\notes\Frontend"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "WARNING: .env.production not found!" -ForegroundColor Red
    Write-Host "Please create .env.production with VITE_API_URL pointing to your backend" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit
    }
}

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
Write-Host "Frontend deployment complete!" -ForegroundColor Green
Write-Host "Test your application at the provided URL" -ForegroundColor Yellow
