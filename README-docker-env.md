# Docker Compose với Multiple Environments

Dự án này được cấu hình để hỗ trợ nhiều môi trường (dev và test) với các file env riêng biệt.

## Cấu trúc File

- `docker-compose.yml` - File compose chính sử dụng biến môi trường
- `.env.dev` - Cấu hình cho môi trường development
- `.env.test` - Cấu hình cho môi trường test
- `docker-compose.ps1` - Script helper để chạy docker-compose

## Cách sử dụng

### Sử dụng Script PowerShell (Khuyến nghị)

```powershell
# Khởi động môi trường dev
.\docker-compose.ps1 -Environment dev -Action up

# Dừng môi trường dev
.\docker-compose.ps1 -Environment dev -Action down

# Xem logs môi trường test
.\docker-compose.ps1 -Environment test -Action logs

# Khởi động lại môi trường dev
.\docker-compose.ps1 -Environment dev -Action restart

# Xem trạng thái services
.\docker-compose.ps1 -Environment dev -Action ps
```

### Sử dụng Docker Compose trực tiếp

```powershell
# Môi trường dev
docker-compose --env-file .env.dev up -d
docker-compose --env-file .env.dev down
docker-compose --env-file .env.dev logs -f

# Môi trường test
docker-compose --env-file .env.test up -d
docker-compose --env-file .env.test down
docker-compose --env-file .env.test logs -f
```

## Khác biệt giữa các môi trường

### Development (.env.dev)
- Elasticsearch port: `9200`
- Kibana port: `5601`
- Container names: `elasticsearch-dev`, `kibana-dev`
- Memory: `1GB` (Xms1g -Xmx1g)
- Password: `dev_password_123`
- Volume: `esdata-dev`

### Test (.env.test)
- Elasticsearch port: `9201`
- Kibana port: `5602`
- Container names: `elasticsearch-test`, `kibana-test`
- Memory: `512MB` (Xms512m -Xmx512m)
- Password: `test_password_123`
- Volume: `esdata-test`

## Lưu ý

- Các môi trường có thể chạy đồng thời vì sử dụng ports khác nhau
- Mỗi môi trường có volume riêng để tránh xung đột dữ liệu
- Thay đổi password trong file `.env.*` cho phù hợp với môi trường của bạn
- File `.env.*` nên được thêm vào `.gitignore` nếu chứa thông tin nhạy cảm

## Troubleshooting

Nếu gặp lỗi port đã được sử dụng, kiểm tra:
```powershell
docker ps -a
```

Để xóa volumes cũ:
```powershell
docker-compose --env-file .env.dev down -v
docker-compose --env-file .env.test down -v
```

