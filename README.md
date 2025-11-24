# Elasticsearch API Server

Một server API Elasticsearch đầy đủ tính năng, được xây dựng bằng Node.js và Express, hỗ trợ tất cả các chức năng tìm kiếm từ cơ bản đến nâng cao, phù hợp cho việc tìm kiếm dữ liệu quy mô lớn với 8M+ bản ghi.

## Tính năng

### 🔍 Tìm kiếm cơ bản
- Tìm kiếm toàn văn
- Khớp chính xác
- Truy vấn phạm vi
- Tìm kiếm tiền tố/wildcard
- Tìm kiếm mờ (fuzzy)
- Truy vấn Boolean (AND/OR/NOT)
- Tìm kiếm phân trang

### 📊 Chức năng Aggregation
- Thống kê aggregation
- Terms aggregation (nhóm)
- Date histogram
- Range aggregation
- Nested aggregation
- Percentiles
- Cardinality aggregation (đếm giá trị duy nhất)
- Trung bình/Tối đa/Tối thiểu/Tổng
- Geo bounds aggregation
- Composite aggregation

### 🚀 Tìm kiếm nâng cao
- Tìm kiếm đa trường
- Phrase matching
- Highlight search
- Function score
- Geo distance search
- Nested query
- Script query
- Scroll search (cho dataset lớn)
- Search template
- Suggest search (tự động hoàn thành)
- Multi-index search
- Field collapsing (loại bỏ trùng lặp)
- Query explanation
- Query validation
- Batch search
- Performance profiling

## Bắt đầu nhanh

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env`:

```env
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
PORT=3000
```

### 3. Khởi động Elasticsearch

```bash
docker-compose up -d
```

Đợi Elasticsearch khởi động hoàn toàn (khoảng 30-60 giây).

### 4. Khởi động server

```bash
npm start
```

Hoặc sử dụng chế độ development (tự động restart):

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`.

## API Endpoints

### Health Check

```bash
GET /health
```

### API Tìm kiếm cơ bản (`/api/search`)

#### 1. Tìm kiếm toàn văn
```bash
POST /api/search/basic
Body: {
  "index": "orders",
  "query": "từ khóa tìm kiếm",
  "fields": ["field1", "field2"]
}
```

#### 2. Khớp chính xác
```bash
POST /api/search/match
Body: {
  "index": "orders",
  "field": "sku",
  "value": "SKU123"
}
```

#### 3. Khớp giá trị chính xác (keyword)
```bash
POST /api/search/term
Body: {
  "index": "orders",
  "field": "orderNameXPwId",
  "value": "ORDER123"
}
```

#### 4. Khớp nhiều giá trị
```bash
POST /api/search/terms
Body: {
  "index": "orders",
  "field": "sku",
  "values": ["SKU1", "SKU2", "SKU3"]
}
```

#### 5. Truy vấn phạm vi
```bash
POST /api/search/range
Body: {
  "index": "orders",
  "field": "totalFee",
  "gte": 100,
  "lte": 1000
}
```

#### 6. Tìm kiếm tiền tố
```bash
POST /api/search/prefix
Body: {
  "index": "orders",
  "field": "orderNameXPwId",
  "prefix": "ORDER"
}
```

#### 7. Tìm kiếm wildcard
```bash
POST /api/search/wildcard
Body: {
  "index": "orders",
  "field": "sku",
  "wildcard": "SKU*"
}
```

#### 8. Tìm kiếm mờ (fuzzy)
```bash
POST /api/search/fuzzy
Body: {
  "index": "orders",
  "field": "shippingName",
  "value": "John",
  "fuzziness": "AUTO"
}
```

#### 9. Truy vấn Boolean
```bash
POST /api/search/bool
Body: {
  "index": "orders",
  "must": [
    { "match": { "field1": "value1" } }
  ],
  "must_not": [
    { "term": { "field2": "value2" } }
  ],
  "should": [
    { "match": { "field3": "value3" } }
  ],
  "filter": [
    { "range": { "field4": { "gte": 100 } } }
  ]
}
```

#### 10. Tìm kiếm phân trang
```bash
POST /api/search/paginated
Body: {
  "index": "orders",
  "query": { "match_all": {} },
  "page": 1,
  "size": 10,
  "sort": [
    { "createdAt": { "order": "desc" } }
  ]
}
```

### API Quản lý Index (`/api/index`)

#### Tạo index
```bash
POST /api/index/create
Body: {
  "index": "orders",
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "orderNameXPwId": { "type": "keyword" },
      "sku": { "type": "keyword" },
      "shippingName": { "type": "text" },
      "createdAt": { "type": "date" },
      "totalFee": { "type": "float" }
    }
  }
}
```

#### Index document
```bash
POST /api/index/:index/document
Body: {
  "id": "doc123",
  "document": {
    "orderNameXPwId": "ORDER123",
    "sku": "SKU123",
    "shippingName": "John Doe"
  }
}
```

#### Bulk index
```bash
POST /api/index/:index/bulk
Body: {
  "documents": [
    { "id": "1", "document": { "field": "value1" } },
    { "id": "2", "document": { "field": "value2" } }
  ]
}
```

### API Aggregation (`/api/aggregation`)

#### Terms aggregation
```bash
POST /api/aggregation/terms
Body: {
  "index": "orders",
  "field": "sku",
  "size": 10
}
```

#### Date histogram
```bash
POST /api/aggregation/date-histogram
Body: {
  "index": "orders",
  "field": "createdAt",
  "interval": "day"
}
```

#### Stats aggregation
```bash
POST /api/aggregation/stats
Body: {
  "index": "orders",
  "field": "totalFee"
}
```

### API Tìm kiếm nâng cao (`/api/advanced`)

#### Highlight search
```bash
POST /api/advanced/highlight
Body: {
  "index": "orders",
  "query": "từ khóa tìm kiếm",
  "fields": ["shippingName", "sku"]
}
```

#### Scroll search (cho dataset lớn)
```bash
POST /api/advanced/scroll
Body: {
  "index": "orders",
  "query": { "match_all": {} },
  "size": 1000,
  "scroll": "1m"
}
```

#### Multi-index search
```bash
POST /api/advanced/multi-index
Body: {
  "indices": ["orders", "products"],
  "query": { "match": { "field": "value" } }
}
```

## Khuyến nghị tối ưu hiệu suất cho 8M bản ghi

### 1. Cấu hình Index
- Sử dụng số lượng shard phù hợp (khuyến nghị: lượng dữ liệu / dung lượng mỗi shard)
- Thiết lập số lượng replica hợp lý (khuyến nghị 1-2 cho môi trường production)
- Tối ưu mapping, sử dụng đúng kiểu dữ liệu cho từng field

### 2. Tối ưu Query
- Sử dụng `filter` thay vì `query` cho khớp chính xác (không tính điểm relevance)
- Sử dụng `scroll` API để xử lý dataset lớn
- Tránh phân trang sâu (sử dụng `search_after`)
- Sử dụng `_source` filtering để chỉ trả về các field cần thiết

### 3. Thao tác Batch
- Sử dụng `bulk` API để index hàng loạt
- Kích thước batch khuyến nghị: 1000-5000 bản ghi
- Sử dụng kiểm soát đồng thời để tránh quá tải

### 4. Giám sát và Tuning
- Sử dụng `/api/advanced/profile` để phân tích hiệu suất query
- Giám sát trạng thái sức khỏe cluster
- Tối ưu index định kỳ (force merge)

## Cấu hình Docker

Elasticsearch đã được cấu hình với authentication:
- Username: `elastic`
- Password: `changeme` (vui lòng thay đổi trong môi trường production)

Sửa `ELASTIC_PASSWORD` trong `docker-compose.yml` để thay đổi password.

### Users và Roles

- **User `elastic`**: Superuser, có tất cả quyền. Dùng để đăng nhập vào Kibana UI và quản lý Elasticsearch.
- **User `kibana_system`**: User dành cho Kibana để kết nối với Elasticsearch. Có role `kibana_system` (built-in).

### Scripts hữu ích

```bash
# Reset password cho kibana_system
npm run reset-kibana-password

# Kiểm tra kết nối Kibana
npm run check-kibana

# Tạo index mẫu
npm run create-index

# Bulk index dữ liệu mẫu
npm run bulk-index
```

## Ví dụ: Đồng bộ dữ liệu từ MongoDB lên Elasticsearch

Tham khảo file `test.js` để xem ví dụ đồng bộ hàng loạt, có thể:
1. Đọc dữ liệu từ MongoDB
2. Index hàng loạt lên Elasticsearch
3. Giám sát tiến độ đồng bộ

## Cấu trúc Project

```
elastic-local/
├── config/
│   └── elasticsearch.js      # Cấu hình Elasticsearch client
├── routes/
│   ├── search.js             # API tìm kiếm cơ bản
│   ├── index.js              # API quản lý index
│   ├── aggregation.js        # API aggregation
│   └── advanced.js           # API tìm kiếm nâng cao
├── scripts/
│   ├── create-sample-index.js    # Script tạo index mẫu
│   ├── bulk-index-example.js    # Script bulk index mẫu
│   ├── reset-kibana-password.js # Script reset password
│   └── check-kibana-connection.js # Script kiểm tra kết nối
├── server.js                 # Express server chính
├── docker-compose.yml        # Cấu hình Docker
└── package.json              # Dependencies và scripts
```

## Troubleshooting

### Kibana không kết nối được với Elasticsearch

1. Kiểm tra password của `kibana_system`:
```bash
npm run reset-kibana-password
```

2. Restart containers:
```bash
docker compose restart kibana
```

3. Kiểm tra logs:
```bash
docker compose logs kibana
docker compose logs elasticsearch
```

### Lỗi permission khi truy cập Kibana

- Đảm bảo đăng nhập bằng user `elastic`, không phải `kibana_system`
- Xóa cache trình duyệt hoặc sử dụng chế độ ẩn danh
- Một số tính năng (như AI Assistant) cần license Enterprise

## License

ISC
