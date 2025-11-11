# Database Configuration Guide

## Overview

Dự án hỗ trợ 2 loại database:

1. **SQLite** (Mặc định)
   - ✅ Đơn giản, không cần cài đặt
   - ✅ Phù hợp cho development và small-scale
   - ✅ Dữ liệu lưu trong Docker volume `api_db`
   - ⚠️ Không tối ưu cho concurrent writes

2. **PostgreSQL** (Production)
   - ✅ Hiệu năng cao, robust
   - ✅ Phù hợp cho production
   - ✅ Hỗ trợ concurrent connections tốt
   - ⚠️ Cần cấu hình và resource nhiều hơn

## Quick Switch

### Windows (PowerShell):
```powershell
.\switch_database.ps1
```

### Linux/Mac:
```bash
./switch_database.sh
```

Hoặc thủ công:

```bash
# Edit .env file
USE_POSTGRES=False  # SQLite
# or
USE_POSTGRES=True   # PostgreSQL

# Restart API
docker-compose restart api
```

## Current Database Status

Kiểm tra database đang dùng:

```powershell
# Xem trong .env
cat .env | grep USE_POSTGRES

# Hoặc dùng script
.\switch_database.ps1  # chọn option 3
```

## Database Locations

### SQLite:
```
Location: Docker volume 'api_db'
Path inside container: /app/db/db.sqlite3
Mount: api_db:/app/db (in docker-compose.yml)

Current data: ~60 users and all sites/quizzes
```

### PostgreSQL:
```
Service: db (PostgreSQL 15-alpine)
Container: map-db-1
Volume: postgres_data
Database: heritage_db
User: heritage_user
Port: 5432 (internal only)
```

## Migration SQLite → PostgreSQL

### Automatic Migration (Recommended):

**Windows:**
```powershell
.\migrate_to_postgres.ps1
```

**Linux/Mac:**
```bash
./migrate_to_postgres.sh
```

Script sẽ:
1. ✅ Export tất cả data từ SQLite (api_db volume)
2. ✅ Switch sang PostgreSQL
3. ✅ Run migrations
4. ✅ Import data vào PostgreSQL
5. ✅ Verify user count
6. ❌ Auto rollback nếu có lỗi

### Manual Migration:

```powershell
# 1. Đảm bảo đang dùng SQLite
USE_POSTGRES=False
docker-compose restart api

# 2. Export data
docker-compose exec api python manage.py dumpdata `
  --natural-foreign --natural-primary `
  -e contenttypes -e auth.Permission `
  --indent 2 > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').json

# 3. Switch to PostgreSQL
USE_POSTGRES=True
docker-compose restart api

# 4. Run migrations
docker-compose exec api python manage.py migrate

# 5. Import data
cat backup_*.json | docker-compose exec -T api python manage.py loaddata --format=json -

# 6. Verify
docker-compose exec api python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.count()  # Should see ~60
```

## Backup & Restore

### SQLite Backup:

```powershell
# Backup
docker-compose exec api python manage.py dumpdata > backup.json

# Restore
cat backup.json | docker-compose exec -T api python manage.py loaddata --format=json -
```

### PostgreSQL Backup:

```powershell
# Backup
docker-compose exec db pg_dump -U heritage_user heritage_db > backup.sql

# Restore
cat backup.sql | docker-compose exec -T db psql -U heritage_user heritage_db
```

## Troubleshooting

### "Database is locked" (SQLite)
```powershell
# Restart API container
docker-compose restart api
```

### "Connection refused" (PostgreSQL)
```powershell
# Check PostgreSQL is running
docker-compose ps db

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Data không thấy sau khi switch
```powershell
# Kiểm tra USE_POSTGRES
cat .env | grep USE_POSTGRES

# Kiểm tra migrations
docker-compose exec api python manage.py showmigrations

# Xem user count
docker-compose exec api python manage.py shell
>>> from django.contrib.auth.models import User
>>> print(User.objects.count())
```

### Migration lỗi
```powershell
# Rollback về SQLite
USE_POSTGRES=False
docker-compose restart api

# Data vẫn an toàn trong:
# - Docker volume: api_db
# - Export file: data_export_*.json
```

## Database Schema

Xem migrations tại `api/heritage/migrations/`:

- `0001_initial.py` - Core models (Site, Feedback)
- `0005_quiz_quizattempt.py` - Quiz system
- `0008_add_user_profile_system.py` - User profiles
- `0011_userrole.py` - Role management
- `0012_comment_quizbattle_*.py` - Comment & Battle system

## Environment Variables

### SQLite Configuration:
```bash
USE_POSTGRES=False
# No additional config needed
```

### PostgreSQL Configuration:
```bash
USE_POSTGRES=True
POSTGRES_DB=heritage_db
POSTGRES_USER=heritage_user
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://heritage_user:password@db:5432/heritage_db
```

## Performance Comparison

### SQLite:
- Read: Fast ⚡
- Write: Medium ⚡⚡
- Concurrent: Limited 🔴
- Setup: Easy 🟢
- Backup: Easy 🟢

### PostgreSQL:
- Read: Fast ⚡⚡
- Write: Fast ⚡⚡⚡
- Concurrent: Excellent 🟢🟢🟢
- Setup: Medium 🟡
- Backup: Medium 🟡

## Recommendations

### Development:
✅ Use SQLite
- Nhanh, đơn giản
- Không cần setup thêm
- Dữ liệu trong volume api_db

### Production:
✅ Use PostgreSQL
- Hiệu năng tốt
- Concurrent connections
- Backup/restore chuyên nghiệp

### Migration Strategy:
1. Develop với SQLite
2. Test với cả 2 databases (dùng switch script)
3. Migrate sang PostgreSQL trước khi production
4. Keep SQLite backup trong volume

## Scripts Reference

### switch_database.ps1/sh
```
Options:
1. Switch to SQLite
2. Switch to PostgreSQL
3. Show current status
4. Test connection
```

### migrate_to_postgres.ps1/sh
```
Steps:
1. Ensure SQLite active
2. Export from api_db volume
3. Switch to PostgreSQL
4. Run migrations
5. Import data
6. Verify count
7. Auto rollback if error
```

## Support

Nếu gặp vấn đề:

1. Check logs: `docker-compose logs api`
2. Check database: `.\switch_database.ps1` → option 3
3. Test connection: `.\switch_database.ps1` → option 4
4. Verify data: `docker-compose exec api python manage.py shell`

Data của bạn luôn an toàn trong Docker volumes!
