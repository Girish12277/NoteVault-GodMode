# Complete Deployment Script
# Deploys both Backend and Frontend to Vercel

Write-Host "=== NoteVault Complete Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login check
Write-Host "Checking Vercel login status..." -ForegroundColor Yellow
vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Vercel first" -ForegroundColor Red
    vercel login
}

Write-Host ""
Write-Host "Step 1: Deploying Backend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Set-Location "c:\Users\LENOVO\Videos\notes\Backend"

$deployType = Read-Host "Deploy to (1) Preview or (2) Production? Enter 1 or 2"

if ($deployType -eq "2") {
    Write-Host "Deploying Backend to PRODUCTION..." -ForegroundColor Yellow
    vercel --prod
    $backendUrl = Read-Host "Enter the deployed backend URL (e.g., https://your-backend.vercel.app)"
} else {
    Write-Host "Deploying Backend to PREVIEW..." -ForegroundColor Yellow
    vercel
    $backendUrl = Read-Host "Enter the deployed backend URL (e.g., https://your-backend-xyz.vercel.app)"
}

Write-Host ""
Write-Host "Backend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Update Frontend .env.production
Write-Host "Step 2: Updating Frontend configuration..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Set-Location "c:\Users\LENOVO\Videos\notes\Frontend"

$envContent = "VITE_API_URL=$backendUrl"
Set-Content -Path ".env.production" -Value $envContent
Write-Host "Updated .env.production with backend URL: $backendUrl" -ForegroundColor Green
Write-Host ""

# Deploy Frontend
Write-Host "Step 3: Deploying Frontend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if ($deployType -eq "2") {
    Write-Host "Deploying Frontend to PRODUCTION..." -ForegroundColor Yellow
    vercel --prod
} else {
    Write-Host "Deploying Frontend to PREVIEW..." -ForegroundColor Yellow
    vercel
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables in Vercel Dashboard for Backend" -ForegroundColor White
Write-Host "2. Test your backend API endpoints" -ForegroundColor White
Write-Host "3. Test your frontend application" -ForegroundColor White
Write-Host "4. Verify frontend-backend connectivity" -ForegroundColor White
Write-Host ""
Write-Host "Important: Don't forget to add all environment variables from Backend/.env to Vercel!" -ForegroundColor Red
