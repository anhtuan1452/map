# Production Deployment Script for VPS
# Chạy script này trên VPS của bạn (Linux)

Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Update system
Write-Host "📦 Updating system packages..." -ForegroundColor Yellow
sudo apt update
sudo apt upgrade -y

# Install required packages
Write-Host "📦 Installing Docker and Docker Compose..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://get.docker.com" -OutFile "get-docker.sh"
sudo sh get-docker.sh
sudo apt install -y docker-compose git

# Clone repository
Write-Host "📥 Cloning repository..." -ForegroundColor Yellow
git clone https://github.com/your-username/Map.git Map
Set-Location Map

# Setup production environment
Write-Host "⚙️ Setting up production environment..." -ForegroundColor Yellow
Copy-Item .env.production .env

Write-Host "⚠️  IMPORTANT: Edit .env file with your production settings!" -ForegroundColor Red
Write-Host "   - Change DJANGO_SECRET_KEY (generate new one)" -ForegroundColor White
Write-Host "   - Set ALLOWED_HOSTS to your domain/IP" -ForegroundColor White
Write-Host "   - Configure email settings" -ForegroundColor White
Write-Host "   - Update CORS_ALLOWED_ORIGINS" -ForegroundColor White
Write-Host "   - Set DOMAIN to your domain" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter after editing .env file"

# Build and start services
Write-Host "🏗️ Building and starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Run migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml exec api python manage.py migrate

# Create superuser
Write-Host "👤 Creating admin user..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml exec api python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Superuser created: admin/admin123')
else:
    print('ℹ️  Superuser already exists')
"

# Check services status
Write-Host "🔍 Checking services status..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml ps

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access your application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://your-vps-ip:5173" -ForegroundColor White
Write-Host "   API: http://your-vps-ip:8000" -ForegroundColor White
Write-Host "   Admin: http://your-vps-ip:8000/admin (admin/admin123)" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Next steps for production:" -ForegroundColor Yellow
Write-Host "1. Setup domain and SSL (see DEPLOYMENT.md)" -ForegroundColor White
Write-Host "2. Configure firewall (allow ports 80, 443, 22)" -ForegroundColor White
Write-Host "3. Setup monitoring and backups" -ForegroundColor White
Write-Host "4. Change default admin password" -ForegroundColor White