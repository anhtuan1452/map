# 🚀 Production Deployment Guide

## Chuẩn bị trước khi deploy

### 1. Backup dữ liệu hiện tại
```bash
# Đã backup PostgreSQL data
./backup_postgres.sh
```

### 2. Chuẩn bị VPS
- Ubuntu 20.04/22.04 (khuyến nghị)
- Ít nhất 2GB RAM, 20GB disk
- Đã cài Docker & Docker Compose

### 3. Chuẩn bị domain (tùy chọn)
- Mua domain và trỏ A record về VPS IP
- Hoặc dùng VPS IP trực tiếp

## 📋 Các bước deploy

### Bước 1: Upload code lên VPS
```bash
# Trên VPS của bạn:
git clone https://github.com/your-username/Map.git
cd Map
```

### Bước 2: Cấu hình production
```bash
# Copy production config
cp .env.production .env

# Edit .env với thông tin của bạn
nano .env
```

**Quan trọng - Thay đổi các thông tin sau:**
```env
DJANGO_SECRET_KEY=your-super-secure-random-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-vps-ip
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
FEEDBACK_EMAIL=admin@yourdomain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
DOMAIN=your-domain.com
```

### Bước 3: Deploy
```bash
# Chạy script deploy
chmod +x deploy_to_vps.sh
./deploy_to_vps.sh
```

### Bước 4: Kiểm tra
```bash
# Kiểm tra services
docker-compose -f docker-compose.production.yml ps

# Kiểm tra logs
docker-compose -f docker-compose.production.yml logs -f
```

## 🌐 Truy cập ứng dụng

- **Frontend**: `http://your-vps-ip:5173`
- **API**: `http://your-vps-ip:8000`
- **Admin**: `http://your-vps-ip:8000/admin`
  - Username: `admin`
  - Password: `admin123`

## 🔒 Bảo mật production

### 1. Thay đổi admin password
```bash
docker-compose -f docker-compose.production.yml exec api python manage.py changepassword admin
```

### 2. Cấu hình firewall
```bash
# Chỉ cho phép ports cần thiết
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5173/tcp  # Frontend
sudo ufw allow 8000/tcp  # API
sudo ufw --force enable
```

### 3. SSL Certificate (HTTPS)
```bash
# Cài Certbot
sudo apt install certbot python3-certbot-nginx -y

# Lấy SSL certificate
sudo certbot certonly --standalone -d your-domain.com
```

### 4. Cấu hình Nginx (tùy chọn)
```bash
# Cài Nginx
sudo apt install nginx -y

# Cấu hình reverse proxy
sudo nano /etc/nginx/sites-available/heritage
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/heritage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📊 Monitoring & Backup

### Backup tự động
```bash
# Tạo cron job backup hàng ngày
crontab -e

# Thêm dòng này:
0 2 * * * cd /path/to/Map && ./backup_postgres.sh
```

### Monitoring
```bash
# Xem logs
docker-compose -f docker-compose.production.yml logs -f

# Kiểm tra disk usage
df -h

# Kiểm tra memory
free -h
```

## 🔄 Update production

Khi có thay đổi code:
```bash
# Trên VPS
cd Map
git pull origin main
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
docker-compose -f docker-compose.production.yml exec api python manage.py migrate
```

## 🆘 Troubleshooting

### Services không start
```bash
# Kiểm tra logs
docker-compose -f docker-compose.production.yml logs

# Restart services
docker-compose -f docker-compose.production.yml restart
```

### Database connection error
```bash
# Kiểm tra PostgreSQL
docker-compose -f docker-compose.production.yml exec db psql -U heritage_user -d heritage_db -c "SELECT 1;"

# Restart database
docker-compose -f docker-compose.production.yml restart db
```

### Port conflicts
```bash
# Kiểm tra ports đang dùng
sudo netstat -tulpn | grep :5173
sudo netstat -tulpn | grep :8000

# Thay đổi ports trong docker-compose.production.yml nếu cần
```

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: `docker-compose -f docker-compose.production.yml logs`
2. Verify .env settings
3. Test locally first
4. Check DEPLOYMENT.md for detailed guides