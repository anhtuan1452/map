# Heritage Map - Di sản Văn hóa Việt Nam

Hệ thống quản lý và khám phá di sản văn hóa với bản đồ tương tác, quiz battle, và tính năng xã hội.

## 🚀 Quick Start

### Development (Local)

1. **Clone repository**
```bash
git clone <your-repo-url>
cd Map
```

2. **Tạo file `.env`** (copy từ `.env.example`)
```bash
cp .env.example .env
```

3. **Chỉnh sửa `.env`** với thông tin của bạn:
```env
DJANGO_SECRET_KEY=your-secret-key-here
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
FEEDBACK_EMAIL=admin@example.com
```

4. **Chạy với Docker**
```bash
docker-compose up -d
```

5. **Truy cập**
- Frontend: http://localhost:5173
- API: http://localhost:8000
- Admin: http://localhost:8000/admin

## �️ Database Options

### SQLite (Mặc định - Development)
- ✅ Dễ setup, không cần config
- ✅ File-based, dễ backup
- ❌ Không tốt cho nhiều concurrent users
- ❌ Không scale được

### PostgreSQL (Khuyến nghị Production)
- ✅ Production-ready, scale tốt
- ✅ Hỗ trợ concurrent users
- ✅ Backup/restore chuyên nghiệp
- ⚠️ Cần config thêm

**Khuyến nghị:**
- Development: Dùng SQLite
- Production (VPS): Dùng PostgreSQL

## �📦 Production Deployment trên VPS

### Chuẩn bị VPS

1. **Cài đặt Docker & Docker Compose**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y
```

2. **Cài đặt Git**
```bash
sudo apt update
sudo apt install git -y
```

### Deploy lên VPS

1. **Clone project**
```bash
git clone <your-repo-url>
cd Map
```

2. **Tạo file `.env` production**
```bash
nano .env
```

Paste nội dung:
```env
# QUAN TRỌNG: Đổi SECRET_KEY và tắt DEBUG trong production!
DJANGO_SECRET_KEY=<random-secure-key-here>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,<vps-ip>

# Email
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
FEEDBACK_EMAIL=admin@yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Domain
DOMAIN=your-domain.com
```

3. **Build và chạy**
```bash
docker-compose up -d --build
```

4. **Chạy migrations**
```bash
docker-compose exec api python manage.py migrate
```

5. **Tạo superuser (admin)**
```bash
docker-compose exec api python manage.py createsuperuser
```

### Cập nhật tự động khi có thay đổi

Tạo script `update.sh`:
```bash
#!/bin/bash
echo "🔄 Updating application..."
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose exec api python manage.py migrate
echo "✅ Update complete!"
```

Chạy:
```bash
chmod +x update.sh
./update.sh
```

### Thiết lập tên miền

1. **Trỏ domain về VPS IP**
   - Vào DNS của domain
   - Tạo A record: `@` → `<vps-ip>`
   - Tạo A record: `www` → `<vps-ip>`

2. **Cài đặt Nginx (reverse proxy)**
```bash
sudo apt install nginx -y
```

3. **Cấu hình Nginx**
```bash
sudo nano /etc/nginx/sites-available/heritage
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /media/ {
        proxy_pass http://localhost:8000;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/heritage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Cài SSL (HTTPS) với Certbot**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 🔧 Quản lý

### Xem logs
```bash
# Tất cả services
docker-compose logs -f

# Chỉ API
docker-compose logs -f api

# Chỉ Web
docker-compose logs -f web
```

### Restart services
```bash
docker-compose restart
```

### Stop services
```bash
docker-compose down
```

### Backup/Restore Database

#### SQLite (Development)
```bash
# Backup
./backup_db.sh

# Restore
./restore_db.sh backup_db_20250110_120000.sqlite3
```

#### PostgreSQL (Production)
```bash
# Backup
./backup_postgres.sh

# Restore
./restore_postgres.sh backup_postgres_20250110_120000.sql.gz
```

#### Migrate từ SQLite sang PostgreSQL
```bash
./migrate_to_postgres.sh
```

## 📝 Cấu trúc Project

```
Map/
├── api/                    # Django backend
│   ├── heritage/          # Main app
│   ├── project/           # Settings
│   └── manage.py
├── web/                   # React frontend
│   ├── src/
│   └── package.json
├── cloudflared/          # Cloudflare tunnel config
├── docker-compose.yml    # Docker config
├── .env                  # Environment variables (KHÔNG commit!)
└── .env.example          # Template
```

## 🔒 Bảo mật

**QUAN TRỌNG:**
- ❌ KHÔNG commit file `.env` lên GitHub
- ✅ Luôn dùng `.env.example` làm template
- ✅ Đổi `DJANGO_SECRET_KEY` trong production
- ✅ Set `DEBUG=False` trong production
- ✅ Chỉ list domain cụ thể trong `ALLOWED_HOSTS`

## 📞 Support

- Email: ttlinhpanang@gmail.com
- GitHub: <your-repo-url>
