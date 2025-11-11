# 🔒 Security Checklist & Deployment Guide

## ✅ Đã hoàn thành (Current State)

### 1. Authentication & Authorization
- ✅ **Session-based authentication** với Django REST Framework
- ✅ **CSRF Protection** được kích hoạt cho tất cả mutating endpoints
- ✅ **Custom authentication class** `CsrfExemptSessionAuthentication` cho login endpoint
- ✅ **Role-based access control** (RBAC):
  - `student`: Làm quiz, tham gia battle
  - `tourist`: Xem bản đồ, viết comment (không quiz)
  - `teacher`: Quản lý comment, thêm/xóa địa điểm, tạo quiz
  - `super_admin`: Quản lý user + tất cả quyền teacher
- ✅ **Password validation** (tối thiểu 6 ký tự)
- ✅ **Username validation** (3-150 ký tự, chỉ alphanumeric + _ -)

### 2. Session & Cookie Security
- ✅ `SESSION_COOKIE_HTTPONLY = True` - Ngăn XSS
- ✅ `SESSION_COOKIE_SAMESITE = 'Lax'` - Ngăn CSRF
- ✅ `SESSION_COOKIE_SECURE = not DEBUG` - Chỉ HTTPS trong production
- ✅ `SESSION_COOKIE_AGE = 86400` - Hết hạn sau 24h
- ✅ `CSRF_COOKIE_HTTPONLY = False` - Cho phép JS đọc để gửi token
- ✅ `CSRF_COOKIE_SAMESITE = 'Lax'`
- ✅ `CSRF_COOKIE_SECURE = not DEBUG`

### 3. CORS Configuration
- ✅ `CORS_ALLOW_CREDENTIALS = True` - Cho phép gửi cookies
- ✅ `CORS_ALLOWED_ORIGINS` được cấu hình qua environment variable
- ✅ Development: `CORS_ALLOW_ALL_ORIGINS = True` khi DEBUG=True
- ✅ Production: Chỉ whitelist domain cụ thể

### 4. Frontend Security
- ✅ Axios instance với `withCredentials: true`
- ✅ Auto-attach CSRF token từ cookie vào header `X-CSRFToken`
- ✅ Gọi `/api/heritage/auth/csrf/` trước khi login để lấy token

### 5. Code Quality
- ✅ Sử dụng `CsrfExemptSessionAuthentication` thay vì `@csrf_exempt`
- ✅ Consistent use of `@authentication_classes` decorator
- ✅ Proper permission checking trong views
- ✅ Environment variables cho sensitive data

## ⚠️ CẦN LÀM TRƯỚC KHI DEPLOY LÊN VPS

### 1. **Thay đổi SECRET_KEY** (BẮT BUỘC)
```bash
# Tạo SECRET_KEY mới bằng Python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Sau đó cập nhật vào file .env trên VPS:
DJANGO_SECRET_KEY=<key-vừa-tạo>
```

### 2. **Tắt DEBUG Mode** (BẮT BUỘC)
Trong file `.env` trên VPS:
```bash
DEBUG=False
```

### 3. **Cấu hình ALLOWED_HOSTS** (BẮT BUỘC)
```bash
ALLOWED_HOSTS=api.khoatkth-dhktdn.click,khoatkth-dhktdn.click
```

### 4. **Cấu hình CORS_ALLOWED_ORIGINS** (BẮT BUỘC)
```bash
CORS_ALLOWED_ORIGINS=https://fe.khoatkth-dhktdn.click,https://api.khoatkth-dhktdn.click
```

### 5. **Cập nhật CSRF_TRUSTED_ORIGINS** trong settings.py
Đảm bảo domain production được thêm vào:
```python
CSRF_TRUSTED_ORIGINS = [
    'https://fe.khoatkth-dhktdn.click',
    'https://api.khoatkth-dhktdn.click',
]
```

### 6. **Cấu hình Database cho Production**
Nếu dùng PostgreSQL:
```bash
USE_POSTGRES=True
POSTGRES_DB=heritage_db
POSTGRES_USER=heritage_user
POSTGRES_PASSWORD=<tạo-password-mạnh-ở-đây>
```

### 7. **Cài đặt Gunicorn** (Production WSGI server)
Đã có trong `docker-compose.production.yml` ✅

### 8. **Static Files Collection**
```bash
# Trong container:
python manage.py collectstatic --noinput
```

## 🔐 Recommendations cho Production

### 1. Rate Limiting
Cân nhắc thêm rate limiting để chống brute force:
```bash
pip install django-ratelimit
```

### 2. HTTPS Enforcement
Thêm vào `settings.py` khi production:
```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
```

### 3. Password Strength
Thêm Django password validators trong `settings.py`:
```python
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

### 4. Logging
Thêm logging cho security events:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': '/app/logs/django.log',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
```

### 5. Backup Database
Thiết lập cron job để backup database định kỳ:
```bash
# Backup PostgreSQL mỗi ngày lúc 2h sáng
0 2 * * * docker exec heritage_db pg_dump -U heritage_user heritage_db > /backups/db_$(date +\%Y\%m\%d).sql
```

## 📋 Pre-Deployment Checklist

- [ ] Đã tạo SECRET_KEY mới và cập nhật vào .env
- [ ] DEBUG=False trong .env
- [ ] ALLOWED_HOSTS đã được cấu hình đúng domain
- [ ] CORS_ALLOWED_ORIGINS đã được cấu hình đúng
- [ ] CSRF_TRUSTED_ORIGINS có domain production
- [ ] Database password đã được thay đổi
- [ ] Email settings đã được cấu hình (nếu dùng)
- [ ] Đã test login/logout trên staging
- [ ] Đã test phân quyền các role
- [ ] Đã test CSRF protection hoạt động
- [ ] Đã backup database hiện tại
- [ ] Đã chuẩn bị rollback plan

## 🚀 Deployment Commands

### Development (Local)
```bash
docker-compose up -d
```

### Production (VPS)
```bash
# Build và start
docker-compose -f docker-compose.production.yml up -d --build

# Xem logs
docker-compose -f docker-compose.production.yml logs -f

# Chạy migrations
docker-compose -f docker-compose.production.yml exec api python manage.py migrate

# Tạo superuser
docker-compose -f docker-compose.production.yml exec api python manage.py createsuperuser
```

## 🐛 Troubleshooting

### Lỗi 403 CSRF
1. Kiểm tra `CSRF_TRUSTED_ORIGINS` có domain đúng không
2. Kiểm tra frontend có gọi `/api/heritage/auth/csrf/` trước khi login không
3. Kiểm tra axios có `withCredentials: true` không
4. Kiểm tra cookie `csrftoken` có được gửi không (DevTools > Network)

### Session không persist
1. Kiểm tra `SESSION_COOKIE_SECURE` - phải False nếu dùng HTTP
2. Kiểm tra `CORS_ALLOW_CREDENTIALS = True`
3. Kiểm tra domain của frontend và backend có match với cookie settings không

### CORS errors
1. Kiểm tra `CORS_ALLOWED_ORIGINS` có domain frontend không
2. Kiểm tra nginx/reverse proxy có pass đúng headers không
3. Thêm domain vào `CSRF_TRUSTED_ORIGINS`

## 📝 Notes

- File này được tạo để đảm bảo deployment an toàn
- Tất cả các điểm bảo mật đã được review
- Logic authentication đã được test và hoạt động tốt
- Ready for production deployment với các bước trên

**Created:** November 11, 2025  
**Last Review:** November 11, 2025  
**Status:** ✅ Ready for Production (với điều kiện hoàn thành checklist)
