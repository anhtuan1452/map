# PowerShell Script to switch between SQLite and PostgreSQL

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $ScriptDir ".env"

# Check if .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Function to update USE_POSTGRES in .env
function Update-PostgresFlag {
    param($NewValue)
    $content = Get-Content $EnvFile
    $updated = $content -replace '^USE_POSTGRES=.*', "USE_POSTGRES=$NewValue"
    $updated | Set-Content $EnvFile
}

# Main menu
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   DATABASE SWITCH TOOL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current settings:" -ForegroundColor Yellow
Get-Content $EnvFile | Select-String "USE_POSTGRES="
Write-Host ""
Write-Host "1) Switch to SQLite (api_db volume - ~60 users)" -ForegroundColor Green
Write-Host "2) Switch to PostgreSQL (db service)" -ForegroundColor Green
Write-Host "3) Show current database status" -ForegroundColor Green
Write-Host "4) Test database connection" -ForegroundColor Green
Write-Host "0) Exit" -ForegroundColor Gray
Write-Host ""
$choice = Read-Host "Choose option"

switch ($choice) {
    "1" {
        Write-Host "🔄 Switching to SQLite..." -ForegroundColor Yellow
        Update-PostgresFlag "False"
        Write-Host "✅ Database switched to SQLite" -ForegroundColor Green
        Write-Host "📝 Restart docker containers: docker-compose restart api" -ForegroundColor Cyan
    }
    "2" {
        Write-Host "🔄 Switching to PostgreSQL..." -ForegroundColor Yellow
        Update-PostgresFlag "True"
        Write-Host "✅ Database switched to PostgreSQL" -ForegroundColor Green
        Write-Host "📝 Restart docker containers: docker-compose restart api" -ForegroundColor Cyan
        Write-Host "⚠️  Remember to run migrations: docker-compose exec api python manage.py migrate" -ForegroundColor Yellow
    }
    "3" {
        Write-Host "📊 Current Database Configuration:" -ForegroundColor Cyan
        Write-Host ""
        $currentLine = Get-Content $EnvFile | Select-String "^USE_POSTGRES=" | Select-Object -First 1
        Write-Host $currentLine
        if ($currentLine -like "*True*") {
            Write-Host "➡️  Using: PostgreSQL (db service)" -ForegroundColor Green
        } else {
            Write-Host "➡️  Using: SQLite (api_db volume)" -ForegroundColor Green
        }
    }
    "4" {
        Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
        docker-compose exec api python manage.py check --database default
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database connection successful!" -ForegroundColor Green
        } else {
            Write-Host "❌ Database connection failed!" -ForegroundColor Red
        }
    }
    "0" {
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "❌ Invalid option!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
