# Bản đồ tương tác - Di tích Quảng Trị

Ứng dụng bản đồ tương tác hiển thị di tích lịch sử với các tính năng:
- 🗺️ Bản đồ tương tác với Leaflet
- 📍 Thông tin chi tiết di tích (Do's & Don'ts)
- 📏 Công cụ đo khoảng cách
- 🎯 Hệ thống Quiz và Quiz Battle
- 💬 Bình luận và đánh giá (có chống spam)
- 👥 Quản lý người dùng và phân quyền
- 🏆 Bảng xếp hạng và huy hiệu

## Cấu trúc dự án

- `api/` - Django REST Framework backend
- `web/` - React TypeScript frontend (Vite)
- `cloudflared/` - Cloudflare Tunnel configuration

## Cài đặt nhanh với Docker

### 1. Clone và setup môi trường

```powershell
# Clone repository
git clone <your-repo>
cd Map

# Copy và chỉnh sửa file .env
copy .env.example .env
# Sau đó mở .env và điền thông tin của bạn
```

### 2. Chạy ứng dụng

```powershell
# Build và khởi động tất cả services
docker-compose build
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f api
```

### 3. Truy cập ứng dụng

- Frontend: http://localhost:5173
- API: http://localhost:8000
- API Admin: http://localhost:8000/admin

## Chuyển đổi Database

Dự án hỗ trợ cả SQLite và PostgreSQL. Sử dụng scripts để chuyển đổi dễ dàng:

### Trên Windows (PowerShell):

```powershell
# Chuyển đổi giữa SQLite và PostgreSQL
.\switch_database.ps1

# Migrate dữ liệu từ SQLite sang PostgreSQL
.\migrate_to_postgres.ps1
```

### Trên Linux/Mac:

```bash
# Chuyển đổi giữa SQLite và PostgreSQL
./switch_database.sh

# Migrate dữ liệu từ SQLite sang PostgreSQL
./migrate_to_postgres.sh
```

### Cấu hình Database trong .env:

```bash
# Dùng SQLite (mặc định - dữ liệu trong volume api_db)
USE_POSTGRES=False

# Chuyển sang PostgreSQL
USE_POSTGRES=True
```

**Lưu ý:** Sau khi thay đổi `USE_POSTGRES`, cần restart container API:
```powershell
docker-compose restart api
```

## Development

### Frontend Development

```powershell
cd web
npm install
npm run dev
```

### Backend Development

```powershell
cd api
python manage.py runserver
```

### Seed dữ liệu mẫu

```powershell
docker-compose exec api python manage.py migrate
docker-compose exec api python manage.py seed_demo
```

## 🚀 Production Deployment

### Chuẩn bị VPS

1. **Cài đặt Docker & Docker Compose**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y
```

2. **Clone project**
```bash
git clone <your-repo-url>
cd Map
```

3. **Tạo file `.env` production**
```bash
cp .env.example .env
nano .env
```

**Quan trọng:** Chỉnh sửa các giá trị sau:
```env
DJANGO_SECRET_KEY=<random-secure-key-here>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your-vps-ip
POSTGRES_PASSWORD=<secure-password>
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
FEEDBACK_EMAIL=admin@yourdomain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
DOMAIN=your-domain.com
```

### Deploy với Docker Production

```bash
# Build và chạy production containers
docker-compose -f docker-compose.production.yml up -d --build

# Chạy migrations
docker-compose -f docker-compose.production.yml exec api python manage.py migrate

# Tạo superuser
docker-compose -f docker-compose.production.yml exec api python manage.py createsuperuser
```

### Cài đặt HTTPS với Let's Encrypt

```bash
# Cài đặt certbot
sudo apt install certbot python3-certbot-nginx -y

# Tạo SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Cập nhật ứng dụng

Tạo script `update.sh`:
```bash
#!/bin/bash
echo "🔄 Updating application..."
git pull origin main
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
docker-compose -f docker-compose.production.yml exec api python manage.py migrate
echo "✅ Update complete!"
```

Chạy update:
```bash
chmod +x update.sh
./update.sh
```

## Tính năng chính

### 🔒 Authentication & Authorization
- JWT token authentication
- Role-based access (Student, Teacher, Admin)
- Profile management với avatar

### 💬 Comment System
- Rate limiting: 2 phút/comment, 5 phút/feedback
- Upload tối đa 3 ảnh/comment (max 10MB/ảnh)
- User có thể xóa comment của mình
- Admin có thể xóa bất kỳ comment nào

### 🎯 Quiz System
- Quiz đơn lẻ với nhiều câu hỏi
- Quiz Battle: đối kháng 1vs1 với thời gian thực
- Leaderboard và hệ thống điểm

### 🏆 Gamification
- Hệ thống huy hiệu (badges)
- Bảng xếp hạng
- Activity tracking

## Các file quan trọng

- `.env` - Cấu hình môi trường (không commit lên git)
- `.env.example` - Template cho .env
- `docker-compose.yml` - Development configuration
- `docker-compose.production.yml` - Production configuration
- `switch_database.ps1/sh` - Script chuyển đổi database
- `migrate_to_postgres.ps1/sh` - Script migrate dữ liệu

## Troubleshooting

### Container không khởi động
```powershell
docker-compose logs api
docker-compose restart api
```

### Database connection error
```powershell
# Kiểm tra cấu hình USE_POSTGRES trong .env
.\switch_database.ps1
# Chọn option 3 để xem current database status
```

### Frontend không kết nối API
- Kiểm tra CORS_ALLOWED_ORIGINS trong .env
- Restart API container: `docker-compose restart api`

## License

MIT License
