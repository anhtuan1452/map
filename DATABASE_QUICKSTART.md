# Hướng dẫn sử dụng Database Switch

## ✅ ĐÃ CẤU HÌNH XONG

Dự án của bạn hiện đã có cơ chế chuyển đổi database dễ dàng giữa SQLite và PostgreSQL!

### 📊 Trạng thái hiện tại:
- **Database đang dùng:** SQLite (api_db volume)
- **Số lượng users:** 58 users
- **Dữ liệu an toàn:** ✅ Trong Docker volume `api_db`

---

## 🚀 CÁCH SỬ DỤNG

### 1️⃣ Chuyển đổi Database (Switch)

#### Trên Windows:
```powershell
.\switch_database.ps1
```

#### Menu sẽ hiện:
```
1) Switch to SQLite (api_db volume - ~60 users)
2) Switch to PostgreSQL (db service)
3) Show current database status
4) Test database connection
0) Exit
```

**Sau khi switch, phải restart API:**
```powershell
docker-compose restart api
```

---

### 2️⃣ Migrate dữ liệu SQLite → PostgreSQL

Khi bạn muốn chuyển hẳn sang PostgreSQL:

#### Trên Windows:
```powershell
.\migrate_to_postgres.ps1
```

Script sẽ tự động:
1. ✅ Export 58 users từ SQLite
2. ✅ Switch sang PostgreSQL
3. ✅ Run migrations
4. ✅ Import tất cả dữ liệu
5. ✅ Verify số lượng users
6. ❌ Auto rollback nếu có lỗi

**Dữ liệu gốc vẫn an toàn trong:**
- Docker volume: `api_db`
- Export file: `data_export_YYYYMMDD_HHMMSS.json`

---

## 📝 Thay đổi thủ công (Manual)

Edit file `.env`:

```bash
# Dùng SQLite (mặc định)
USE_POSTGRES=False

# Chuyển sang PostgreSQL
USE_POSTGRES=True
```

Sau đó restart:
```powershell
docker-compose restart api
```

---

## 🔍 Kiểm tra Database

### Xem đang dùng database nào:
```powershell
cat .env | Select-String "USE_POSTGRES"
```

### Đếm số users:
```powershell
docker-compose exec api python manage.py shell -c "from django.contrib.auth.models import User; print(f'Users: {User.objects.count()}')"
```

### Test connection:
```powershell
docker-compose exec api python manage.py check --database default
```

---

## 💡 Khi nào dùng gì?

### 🟢 Dùng SQLite khi:
- Development/testing
- Dữ liệu nhỏ (< 100 users)
- Đơn giản, nhanh chóng
- **Hiện tại: 58 users - HOÀN TOÀN OK với SQLite**

### 🔵 Dùng PostgreSQL khi:
- Production deployment
- Nhiều concurrent users
- Cần performance tốt hơn
- Scale up (> 100 users)

---

## 🛡️ An toàn dữ liệu

### Backup trước khi migrate:
```powershell
# SQLite backup
docker-compose exec api python manage.py dumpdata > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').json

# PostgreSQL backup
docker-compose exec db pg_dump -U heritage_user heritage_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### Rollback về SQLite:
```powershell
# Edit .env
USE_POSTGRES=False

# Restart
docker-compose restart api
```

Dữ liệu trong `api_db` volume KHÔNG BAO GIỜ BỊ XÓA!

---

## 📚 Tài liệu chi tiết

- **DATABASE.md** - Chi tiết về cấu hình database
- **DEPLOYMENT.md** - Hướng dẫn deploy production
- **README.md** - Tổng quan dự án

---

## ❓ Troubleshooting

### Lỗi "Database is locked":
```powershell
docker-compose restart api
```

### Không thấy users sau khi switch:
```powershell
# Kiểm tra USE_POSTGRES trong .env
cat .env | Select-String "USE_POSTGRES"

# Kiểm tra số users
docker-compose exec api python manage.py shell -c "from django.contrib.auth.models import User; print(User.objects.count())"
```

### Migration failed:
Script sẽ tự động rollback về SQLite. Dữ liệu vẫn an toàn!

---

## 🎯 Kế hoạch tiếp theo

### Bây giờ (Development):
✅ Dùng SQLite - **Đang hoạt động tốt với 58 users**

### Khi deploy VPS:
1. Test PostgreSQL local: `.\switch_database.ps1` → chọn 2
2. Verify hoạt động: check users count
3. Switch back SQLite: chọn 1
4. Khi ready deploy: `.\migrate_to_postgres.ps1`
5. Deploy lên VPS với PostgreSQL

---

## 📞 Liên hệ/Support

Nếu có vấn đề:
1. Check logs: `docker-compose logs api`
2. Check database status: `.\switch_database.ps1` → option 3
3. Xem DATABASE.md để biết chi tiết

**Dữ liệu 58 users của bạn đang an toàn trong Docker volume `api_db`!** ✅
