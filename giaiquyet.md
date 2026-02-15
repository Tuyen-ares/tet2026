# Giải quyết lỗi deploy trên Render

Mô tả ngắn: Khi chạy `npx sequelize-cli db:migrate` trong bước build Render, migration cố kết nối tới `127.0.0.1:3306` và bị `ECONNREFUSED` vì biến môi trường DB chưa được cung cấp cho quá trình build, hoặc Sequelize CLI đang dùng environment `development` mặc định.

Nguyên nhân thường gặp
- Render chạy lệnh migrate mà không có biến `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` → config fallback về `127.0.0.1`.
- Nếu `Root Directory` đã đặt là `backend`, nhưng build command vẫn có `cd backend && ...` sẽ gây lỗi `No such file or directory`.

Mục tiêu
- Đảm bảo build và migration chạy thành công trên Render.

Các bước sửa (copy/paste vào Render UI)

1) Kiểm tra `Root Directory`
- Nếu bạn đã đặt `Root Directory` = `backend`, thì các command trong UI **không** cần `cd backend` trước.
- Nếu để trống (root của repo), keep commands có `cd backend`.

2) Build / Pre-deploy / Start commands (nên dùng A hoặc B theo Root Directory)

A. Nếu `Root Directory = backend` (recommended):

Build Command:
```
npm ci
```

Pre-Deploy Command (chạy migration trước khi start):
```
npx sequelize-cli db:migrate --env production
```

Start Command:
```
npm start
```

B. Nếu `Root Directory` = (repo root) và bạn muốn giữ lệnh tương tự terminal:

Build Command:
```
cd backend && npm ci
```

Pre-Deploy Command:
```
cd backend && npx sequelize-cli db:migrate --env production
```

Start Command:
```
cd backend && npm start
```

3) Thêm biến môi trường (Render → Environment)
 - `DB_DIALECT` = `mysql`
 - `DB_HOST` = `your-db-host`
 - `DB_PORT` = `3306`
 - `DB_USER` or `DB_USERNAME` = `your-db-user`
 - `DB_PASS` or `DB_PASSWORD` = `your-db-password`
 - `DB_NAME` = `your-db-name`
 - `DB_AUTO_SYNC` = `false`
 - `CORS_ORIGINS` = `https://tuyen-ares.github.io/tet2026` (hoặc `*` tạm)

Ghi chú: tên biến phải khớp với `backend/config/config.cjs` và `backend/src/config/env.js`.

4) (Tùy chọn) Thêm script migrate cho production vào `backend/package.json`
```
"scripts": {
  "start": "node server.js",
  "migrate": "npx sequelize-cli db:migrate",
  "migrate:prod": "npx sequelize-cli db:migrate --env production"
}
```
Sau đó có thể gọi `npm run migrate:prod` trong Pre-Deploy.

5) Redeploy và kiểm tra logs
- Manual Deploy → xem Live Logs
- Mong muốn log:
  - `Sequelize CLI [..] Using environment "production".`
  - Không thấy `ECONNREFUSED 127.0.0.1:3306`
  - `API server running at http://localhost:<PORT>`

6) Nếu bạn dùng PlanetScale hoặc DB managed khác
- PlanetScale có thể yêu cầu connection string và một vài `dialectOptions` (SSL). Tham khảo docs PlanetScale + Sequelize để thêm `dialectOptions` nếu cần.

7) Alternative: chạy migrations trong GitHub Actions
- Thay vì chạy migration trong Render build, bạn có thể thêm job trong GitHub Actions để kết nối DB và chạy migrations trước khi Render deploy (hoặc trigger deploy sau khi migrations thành công).

8) Troubleshooting nhanh
- Nếu build báo `cd: backend: No such file or directory` → bạn đang `cd backend` trong khi Root Directory = `backend` → remove `cd backend`.
- Nếu migration vẫn dùng `development` → dùng flag `--env production` hoặc set `NODE_ENV=production` trước lệnh migrate.
- Để debug, thêm `echo` trước lệnh migrate để in ra các biến env cần thiết (không print secrets), ví dụ `echo "$DB_HOST:$DB_USER@$DB_NAME"`.

Nếu cần, tôi có thể:
- Tạo patch vào `backend/package.json` để thêm `migrate:prod` script.
- Viết mẫu exact environment block để bạn paste vào Render UI.
- Viết GitHub Actions job mẫu để chạy migrations.

Hết.
