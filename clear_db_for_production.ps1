# Script để clear/reset database cho production deployment
# Chạy script này trước khi deploy lên VPS

Write-Host "🧹 Clearing database data for production deployment..." -ForegroundColor Green

# Stop containers
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Remove database volumes để clear data
Write-Host "Removing database volumes..." -ForegroundColor Yellow
docker volume rm map_api_db map_postgres_data 2>$null

# Start containers again (sẽ tạo database mới)
Write-Host "Starting containers with fresh database..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Yellow
docker-compose exec api python manage.py migrate

# Create superuser
Write-Host "Creating superuser..." -ForegroundColor Yellow
docker-compose exec api python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

# Seed demo data
Write-Host "Seeding demo data..." -ForegroundColor Yellow
docker-compose exec api python manage.py seed_demo

Write-Host "✅ Database cleared and ready for production!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy .env.production to .env" -ForegroundColor White
Write-Host "2. Update production settings (SECRET_KEY, DEBUG=False, etc.)" -ForegroundColor White
Write-Host "3. Run: docker-compose up -d --build" -ForegroundColor White
Write-Host "4. Access admin at: http://your-vps-ip:8000/admin" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White