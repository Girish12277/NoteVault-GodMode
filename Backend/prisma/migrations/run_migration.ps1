# Content Moderation - Simple Migration Script
# Run this script to migrate the database

Write-Host "Content Moderation Database Migration" -ForegroundColor Cyan
Write-Host "======================================`n"

# PostgreSQL path
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$migrationFile = "$PSScriptRoot\content_moderation_schema.sql"

# Check files exist
if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: psql.exe not found at $psqlPath" -ForegroundColor Red
    Write-Host "`nUse pgAdmin instead:" -ForegroundColor Yellow
    Write-Host "1. Open pgAdmin 4"
    Write-Host "2. Tools > Query Tool (F5)"
    Write-Host "3. Copy SQL from: $migrationFile"
    Write-Host "4. Paste and Execute"
    pause
    exit 1
}

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found at $migrationFile" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "PostgreSQL found: $psqlPath" -ForegroundColor Green
Write-Host "Migration file: $migrationFile" -ForegroundColor Green
Write-Host "`nDatabase: studyvault"
Write-Host "User: postgres"
Write-Host "`nYou will be prompted for the PostgreSQL password...`n"

# Run migration
& $psqlPath -U postgres -d studyvault -f $migrationFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n`nMigration completed successfully!" -ForegroundColor Green
    
    # Quick verification
    Write-Host "`nVerifying tables..." -ForegroundColor Yellow
    & $psqlPath -U postgres -d studyvault -c "SELECT COUNT(*) as table_count FROM pg_tables WHERE tablename LIKE 'moderation%' OR tablename LIKE 'copyright%' OR tablename LIKE 'deleted_notes%';"
    
    Write-Host "`nContent Moderation System - Database Ready!" -ForegroundColor Green
}
else {
    Write-Host "`nMigration failed!" -ForegroundColor Red
}

Write-Host "`n"
pause
