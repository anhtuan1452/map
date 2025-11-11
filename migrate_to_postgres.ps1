# PowerShell Script to migrate from SQLite to PostgreSQL

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SQLITE → POSTGRESQL MIGRATION TOOL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will migrate ~60 users from SQLite to PostgreSQL" -ForegroundColor Yellow
Write-Host "📁 Source: Docker volume 'api_db' (/app/db/db.sqlite3)" -ForegroundColor Yellow
Write-Host "🎯 Target: PostgreSQL service 'db' (heritage_db database)" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne "y") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 0
}

# 1. Make sure we're using SQLite first
Write-Host ""
Write-Host "📝 Step 1: Ensuring SQLite is active..." -ForegroundColor Cyan
$content = Get-Content .env
$updated = $content -replace '^USE_POSTGRES=.*', 'USE_POSTGRES=False'
$updated | Set-Content .env
docker-compose restart api
Start-Sleep -Seconds 3

# 2. Export data from SQLite
Write-Host "📤 Step 2: Exporting data from SQLite (api_db volume)..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$exportFile = "data_export_$timestamp.json"

docker-compose exec -T api python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 | Out-File -Encoding UTF8 $exportFile

if (-not (Test-Path $exportFile)) {
    Write-Host "❌ Export failed!" -ForegroundColor Red
    exit 1
}

$lines = (Get-Content $exportFile).Count
Write-Host "✅ Exported to $exportFile ($lines lines)" -ForegroundColor Green

# 3. Count users
$userCount = (Select-String -Path $exportFile -Pattern '"model": "auth.user"' -AllMatches).Matches.Count
Write-Host "👥 Found $userCount users in export" -ForegroundColor Yellow

# 4. Switch to PostgreSQL
Write-Host ""
Write-Host "🔄 Step 3: Switching to PostgreSQL..." -ForegroundColor Cyan
$content = Get-Content .env
$updated = $content -replace '^USE_POSTGRES=.*', 'USE_POSTGRES=True'
$updated | Set-Content .env

# 5. Start PostgreSQL
Write-Host "🐘 Step 4: Starting PostgreSQL service..." -ForegroundColor Cyan
docker-compose up -d db
Start-Sleep -Seconds 5

# 6. Restart API
Write-Host "🔄 Step 5: Restarting API with PostgreSQL..." -ForegroundColor Cyan
docker-compose restart api
Start-Sleep -Seconds 3

# 7. Run migrations
Write-Host "🗄️  Step 6: Running migrations on PostgreSQL..." -ForegroundColor Cyan
docker-compose exec api python manage.py migrate

# 8. Import data
Write-Host ""
Write-Host "📥 Step 7: Importing data to PostgreSQL..." -ForegroundColor Cyan
Write-Host "⏳ This may take a few minutes for $userCount users..." -ForegroundColor Yellow

Get-Content $exportFile | docker-compose exec -T api python manage.py loaddata --format=json -

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "✅ MIGRATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "📊 Stats:" -ForegroundColor Cyan
    Write-Host "  - Users migrated: $userCount" -ForegroundColor White
    Write-Host "  - Export file: $exportFile" -ForegroundColor White
    Write-Host "  - Database: PostgreSQL (heritage_db)" -ForegroundColor White
    Write-Host ""
    Write-Host "🗑️  Cleanup options:" -ForegroundColor Yellow
    Write-Host "  1. Keep SQLite backup: Leave api_db volume" -ForegroundColor White
    Write-Host "  2. Delete export: Remove-Item $exportFile" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Verify migration:" -ForegroundColor Cyan
    Write-Host "  docker-compose exec api python manage.py shell" -ForegroundColor White
    Write-Host "  >>> from django.contrib.auth.models import User" -ForegroundColor White
    Write-Host "  >>> User.objects.count()" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "❌ MIGRATION FAILED!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "🔙 Rolling back to SQLite..." -ForegroundColor Yellow
    
    $content = Get-Content .env
    $updated = $content -replace '^USE_POSTGRES=.*', 'USE_POSTGRES=False'
    $updated | Set-Content .env
    docker-compose restart api
    
    Write-Host "✅ Rolled back to SQLite" -ForegroundColor Green
    Write-Host "📁 Your data is safe in:" -ForegroundColor Cyan
    Write-Host "  - Docker volume: api_db" -ForegroundColor White
    Write-Host "  - Export backup: $exportFile" -ForegroundColor White
    exit 1
}
