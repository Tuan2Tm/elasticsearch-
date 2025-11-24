# Tổng hợp câu lệnh Docker Compose & Container

Tài liệu này tổng hợp toàn bộ câu lệnh liên quan tới **docker compose**, container và image đã dùng trong dự án. Thực thi mọi lệnh tại thư mục gốc `elastic-local/`.

## 1. Vòng đời cơ bản

- Khởi động toàn bộ dịch vụ (Elasticsearch, Kibana, setup)  
  `docker compose up -d`

- Dừng và xóa container + network + volume  
  `docker compose down -v`

- Chỉ dừng container (giữ volume/network)  
  `docker compose down`

- Xem log realtime cho tất cả dịch vụ  
  `docker compose logs -f`

## 2. Điều khiển từng dịch vụ

- Restart Kibana  
  `docker compose restart kibana`

- Xem 50 dòng log gần nhất của Kibana  
  `docker compose logs kibana --tail 50`

- Theo dõi log Kibana liên tục  
  `docker compose logs -f kibana`

- Log Elasticsearch  
  `docker compose logs elasticsearch`

- Log container setup (quá trình đặt mật khẩu)  
  `docker compose logs setup`

## 3. Chạy lệnh bên trong container

- Gọi REST API trong Elasticsearch container (ví dụ lấy thông tin user)  
  ```bash
  docker compose exec elasticsearch \
    curl -s -u elastic:changeme http://localhost:9200/_security/user/kibana_system
  ```

- Đặt lại mật khẩu ngay trong Elasticsearch container  
  ```bash
  docker compose exec elasticsearch \
    curl -s -u elastic:changeme \
      -H "Content-Type: application/json" \
      -d '{"password":"changeme"}' \
      http://localhost:9200/_security/user/kibana_system/_password
  ```

## 4. Quy trình debug thường dùng

1. **Reset mật khẩu `kibana_system`**  
   `npm run reset-kibana-password`

2. **Kiểm tra quyền & xác thực `kibana_system`**  
   `npm run check-kibana`

3. **Kibana không đăng nhập được**  
   ```bash
   docker compose restart kibana
   docker compose logs -f kibana
   docker compose logs elasticsearch
   ```

4. **Dựng lại toàn bộ cluster**  
   ```bash
   docker compose down -v
   docker compose up -d
   ```

## 5. Mẹo & lưu ý

- Trường `version` trong `docker-compose.yml` đã bị loại bỏ ở Docker Compose mới.
- Cảnh báo kiểu `The "RESPONSE" variable is not set...` nghĩa là Compose không parse được biến shell; hãy dùng script riêng hoặc container `curlimages/curl`.
- Khi log quá dài, dùng PowerShell để lọc:  
  ```powershell
  docker compose logs kibana | Select-String -Pattern "error|authentication"
  ```

Áp dụng các câu lệnh trên giúp bạn xử lý nhanh mọi vấn đề khởi động, xác thực và log của Elasticsearch/Kibana.***

