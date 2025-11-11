#!/bin/bash
# Production Deployment Script for VPS
# Chạy script này trên VPS của bạn

echo "🚀 Starting production deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing Docker and Docker Compose..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install -y docker-compose git

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/your-username/Map.git Map
cd Map

# Setup production environment
echo "⚙️ Setting up production environment..."
cp .env.production .env

echo "⚠️  IMPORTANT: Edit .env file with your production settings!"
echo "   - Change DJANGO_SECRET_KEY"
echo "   - Set ALLOWED_HOSTS to your domain/IP"
echo "   - Configure email settings"
echo "   - Update CORS_ALLOWED_ORIGINS"
echo ""
read -p "Press Enter after editing .env file..."

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Run migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.production.yml exec api python manage.py migrate

# Create superuser
echo "👤 Creating admin user..."
docker-compose -f docker-compose.production.yml exec api python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Superuser created: admin/admin123')
else:
    print('ℹ️  Superuser already exists')
"

# Check services status
echo "🔍 Checking services status..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access your application:"
echo "   Frontend: http://your-vps-ip:5173"
echo "   API: http://your-vps-ip:8000"
echo "   Admin: http://your-vps-ip:8000/admin (admin/admin123)"
echo ""
echo "🔒 Next steps for production:"
echo "1. Setup domain and SSL (see DEPLOYMENT.md)"
echo "2. Configure firewall (allow ports 80, 443, 22)"
echo "3. Setup monitoring and backups"
echo "4. Change default admin password"