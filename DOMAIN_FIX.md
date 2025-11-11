# Hướng dẫn khắc phục lỗi Domain

## Vấn đề hiện tại
Domain báo lỗi 1033 và thiếu origin certificate. Điều này xảy ra vì:
1. Tunnel cần origin certificate để thực hiện một số operations
2. DNS records có thể chưa được thiết lập đúng

## Cách khắc phục

### Bước 1: Download cloudflared CLI trên máy local
```powershell
# Download cloudflared.exe
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
```

### Bước 2: Login và tạo origin certificate
```powershell
# Login vào Cloudflare
.\cloudflared.exe tunnel login

# Tạo DNS records
.\cloudflared.exe tunnel route dns b546a528-d280-42ca-96b3-9127c5767eee fe.khoatkth-dhktdn.click
.\cloudflared.exe tunnel route dns b546a528-d280-42ca-96b3-9127c5767eee api.khoatkth-dhktdn.click
```

### Bước 3: Copy origin certificate vào container
Sau khi login, sẽ có file cert.pem ở `%USERPROFILE%\.cloudflared\cert.pem`

```powershell
# Copy certificate
Copy-Item "$env:USERPROFILE\.cloudflared\cert.pem" -Destination ".\cloudflared\cert.pem"
```

### Bước 4: Cập nhật config.yml
Thêm đường dẫn origin certificate vào config:

```yaml
tunnel: b546a528-d280-42ca-96b3-9127c5767eee
credentials-file: /etc/cloudflared/credentials.json
origincert: /etc/cloudflared/cert.pem

ingress:
  - hostname: fe.khoatkth-dhktdn.click
    service: http://web:5173
  - hostname: api.khoatkth-dhktdn.click
    service: http://api:8000
  - service: http_status:404
```

### Bước 5: Cập nhật docker-compose.yml
Thêm mount cho cert.pem:

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --config /etc/cloudflared/config.yml run
    volumes:
      - ./cloudflared/config.yml:/etc/cloudflared/config.yml:ro
      - ./cloudflared/credentials.json:/etc/cloudflared/credentials.json:ro
      - ./cloudflared/cert.pem:/etc/cloudflared/cert.pem:ro
    depends_on:
      - api
      - web
    restart: unless-stopped
```

### Bước 6: Restart
```powershell
docker-compose restart cloudflared
```

## Hoặc Cách khác: Sử dụng Cloudflare Dashboard

1. Vào Cloudflare Dashboard
2. Chọn domain `khoatkth-dhktdn.click`
3. Vào **Zero Trust** > **Networks** > **Tunnels**
4. Chọn tunnel `b546a528-d280-42ca-96b3-9127c5767eee`
5. Vào tab **Public Hostnames**
6. Thêm 2 hostname:
   - `fe.khoatkth-dhktdn.click` → `http://localhost:5173`
   - `api.khoatkth-dhktdn.click` → `http://localhost:8000`

## Test sau khi sửa
```powershell
# Test frontend
curl https://fe.khoatkth-dhktdn.click

# Test API
curl https://api.khoatkth-dhktdn.click/api/heritage/sites/
```