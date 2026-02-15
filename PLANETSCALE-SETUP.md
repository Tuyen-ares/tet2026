**Chuyển sang Supabase (Postgres) — Hướng dẫn nhanh**

Mình đã đổi hướng: dùng Supabase (Postgres) để có lựa chọn miễn phí cho development và dễ tích hợp với Render.

1) Tạo project Supabase
- Vào https://app.supabase.com và tạo project mới (chọn region gần bạn). Ghi lại `Database URL` hoặc các thông số kết nối (host, port, database, user, password).

2) Thêm thông tin kết nối vào Render (hoặc môi trường bạn dùng)
- Trong dashboard Render cho service backend, vào `Environment` → `Environment Variables` và thêm:

- `DB_DIALECT` = `postgres`
- `DB_HOST` = <supabase-host> (ví dụ: db.abc123.supabase.co)
- `DB_PORT` = `5432`
- `DB_NAME` = <database-name>
- `DB_USER` = <db-user>
- `DB_PASS` = <db-password>
- `DB_URL` = <the full connection string> (ví dụ: postgres://user:pass@host:5432/dbname) — tùy bạn muốn dùng URL hay biến riêng
- `DB_AUTO_SYNC` = `false`

Lưu ý: Render có thể dùng `Secret`/`Environment` -> đảm bảo các biến không lộ.

3) Cập nhật backend để dùng Postgres
- Cài phụ thuộc: trong `backend/` chạy:

```bash
cd backend
npm install pg pg-hstore
```

- Sequelize dùng `DB_DIALECT` để chọn `postgres`. Kiểm tra `backend/src/config/database.js` hoặc `backend/config/config.cjs` và đảm bảo nó đọc `process.env.DB_DIALECT` (hoặc đặt `production` block `dialect: 'postgres'`). Ví dụ thay đổi nhanh trong `backend/config/config.cjs` (production):

```js
production: {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: process.env.DB_DIALECT || 'postgres'
}
```

4) Chạy migration trên Render (Pre-deploy) hoặc thủ công
- Tốt nhất là chạy migrations trong bước Pre-deploy của Render hoặc qua job CI trước khi start server.
- Lệnh chạy migration (từ thư mục `backend`):

```bash
npx sequelize-cli db:migrate --env production
```

- Đảm bảo khi chạy lệnh trên, biến môi trường production (DB_HOST/DB_USER/DB_PASS/DB_NAME/DB_DIALECT) đã có giá trị.

5) Kiểm tra và sửa code nếu cần
- Một số truy vấn SQL/MySQL-specific có thể cần điều chỉnh cho Postgres (ví dụ kiểu dữ liệu, limit/offset edge-cases). Kiểm tra các migration files và model definitions (`backend/models` và `migrations/`).

6) Tối ưu cho concurrency
- Postgres + Supabase xử lý kết nối khác MySQL. Đảm bảo pool trong `backend/src/config/database.js` phù hợp, ví dụ:

```js
pool: {
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '0'),
  acquire: 30000,
  idle: 10000
}
```

7) Tiến hành deploy
- Sau khi đặt env vars và cài `pg`, trigger deploy trên Render. Nếu migration nằm trong Pre-deploy, xem logs để xác nhận `db:migrate` thành công trước khi server start.

8) Rollback / Troubleshoot
- Nếu migration lỗi: kiểm tra logs, kiểm tra `DATABASE_URL`/credentials, và chạy migrations thủ công trên local hoặc trong một ephemeral container.

Tổng kết: Supabase cho bạn tier miễn phí để dev/test; để lên production, cân nhắc backup/plan. Nếu bạn muốn, mình có thể:
- tự động thêm `DB_POOL` config vào `backend/src/config/database.js` (patch),
- hoặc tạo một `README_SUPABASE.md` với step-by-step và các lệnh cần thiết.

Ghi chú: file này thay thế hướng dẫn PlanetScale trước đó.
