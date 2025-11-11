# Hướng dẫn thiết lập Cloudflare Tunnel

## Bước 1: Cài đặt Cloudflare CLI (cloudflared)

### Trên Windows:
```powershell
# Download cloudflared
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
```

## Bước 2: Đăng nhập Cloudflare

```powershell
.\cloudflared.exe tunnel login
```

Lệnh này sẽ mở trình duyệt để bạn đăng nhập vào Cloudflare và chọn domain.

## Bước 3: Tạo Tunnel

```powershell
.\cloudflared.exe tunnel create heritage-map
```

Lệnh này sẽ tạo một tunnel mới và sinh file credentials. Lưu lại:
- **Tunnel ID**: Được hiển thị sau khi tạo
- **Credentials file**: Thường ở `%USERPROFILE%\.cloudflared\<tunnel-id>.json`

## Bước 4: Cấu hình DNS

Tạo DNS record trỏ domain của bạn đến tunnel:

```powershell
# Cho web frontend
.\cloudflared.exe tunnel route dns heritage-map your-domain.com

# Cho API backend
.\cloudflared.exe tunnel route dns heritage-map api.your-domain.com
```

## Bước 5: Copy credentials file

Copy file credentials từ `.cloudflared` folder vào thư mục project:

```powershell
# Tìm file credentials
# Thường ở: C:\Users\<YourUsername>\.cloudflared\<tunnel-id>.json

# Copy vào project
Copy-Item "$env:USERPROFILE\.cloudflared\<tunnel-id>.json" -Destination ".\cloudflared\credentials.json"
```

## Bước 6: Cập nhật config.yml

Mở file `cloudflared/config.yml` và thay thế:
- `<YOUR_TUNNEL_ID>`: Tunnel ID bạn vừa tạo
- `<YOUR_DOMAIN>`: Domain của bạn (ví dụ: heritage-map.com)

Ví dụ:
```yaml
tunnel: abc123-def456-ghi789
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: heritage-map.com
    service: http://web:3000
  - hostname: api.heritage-map.com
    service: http://api:8000
  - service: http_status:404
```

## Bước 7: Chạy Docker Compose

```powershell
docker-compose up -d
```

## Kiểm tra

Sau khi chạy, bạn có thể:
1. Truy cập website tại: `https://your-domain.com`
2. Truy cập API tại: `https://api.your-domain.com`

## Xem logs

```powershell
# Xem logs của cloudflared
docker-compose logs -f cloudflared

# Xem logs của tất cả services
docker-compose logs -f
```

## Dừng services

```powershell
docker-compose down
```

## Lưu ý quan trọng

1. **Bảo mật credentials**: File `cloudflared/credentials.json` chứa thông tin nhạy cảm. Thêm vào `.gitignore`:
   ```
   cloudflared/credentials.json
   ```

2. **CORS Settings**: Nếu API có vấn đề với CORS, cần cấu hình Django settings để cho phép domain của bạn.

3. **HTTPS**: Cloudflare Tunnel tự động cung cấp HTTPS miễn phí cho domain của bạn.

4. **Production**: Để production, nên thay đổi:
   - `DJANGO_SECRET` trong docker-compose.yml
   - Sử dụng production build cho web frontend
   - Tắt debug mode trong Django

## Troubleshooting

### Tunnel không kết nối được
- Kiểm tra Tunnel ID và credentials file đúng chưa
- Xem logs: `docker-compose logs cloudflared`

### DNS không resolve
- Chờ vài phút để DNS propagate
- Kiểm tra DNS records trên Cloudflare dashboard

### CORS errors
Thêm vào Django settings.py:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
]
```
