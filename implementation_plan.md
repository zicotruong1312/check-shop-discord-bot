# Kế Hoạch Triển Khai: Valorant Shop Discord Bot

Dự án này sẽ xây dựng một bot Discord hoàn chỉnh bằng Node.js, cho phép người dùng đăng nhập tài khoản Riot an toàn (với mã hóa AES-256) và kiểm tra danh sách cửa hàng Valorant hằng ngày trực tiếp trên Discord.

## User Review Required

> [!CAUTION]
> API Xác thực của Riot Games (Riot Auth API) thường có các cơ chế chống bot mạnh mẽ (như kiểm tra TLS Fingerprint do Cloudflare hỗ trợ). Nếu gọi bằng `axios` thông thường có thể bị lỗi 403 Forbidden. Chúng ta sẽ cần sử dụng các tùy chỉnh TLS ciphers đặc biệt hoặc module chuyên dụng, tớ sẽ setup phần này cực kỳ cẩn thận. Cậu có đồng ý cho tớ tiến hành không?

> [!IMPORTANT]
> Để chạy bot ở môi trường của cậu trong lúc phát triển, cậu sẽ cần chuẩn bị sẵn:
> 1. **Discord Bot Token & Client/App ID** (Không bật Message Content Intent theo như thiết kế).
> 2. **MongoDB Atlas URI** (Cluster M0 miễn phí).

## Quá Trình Triển Khai

Dự án sẽ được tổ chức theo chuẩn kiến trúc module Node.js.

### Phase 1: Khởi tạo Project & Database
- Khởi tạo `package.json` và cài đặt các dependencies: `discord.js`, `mongoose`, `axios`, `canvas`, `express`, `dotenv`.
- Xây dựng file `.env.example` với danh sách biến môi trường cần thiết.
- Khởi tạo kết nối MongoDB và thiết lập Schema `UserSession` an toàn.

#### [NEW] `package.json`
#### [NEW] `.env.example`
#### [NEW] `src/config/database.js`
#### [NEW] `src/models/UserSession.js`

---

### Phase 2: Bảo mật & Mã hóa (Encryption)
- Viết module mã hóa sử dụng thuật toán `AES-256-CBC` kết hợp **Dynamic IV** (Vector khởi động ngẫu nhiên cho mỗi lần mã hóa). Tránh mã hóa tĩnh sinh ra chuỗi giống nhau.

#### [NEW] `src/utils/encryption.js`

---

### Phase 3: Tích hợp Riot API & Logic Xác Thực
- Viết các hàm giao tiếp trực tiếp với Riot Service (Lấy Cookies, Request Access Token và Entitlement Token).
- Xây dựng cơ chế refresh token khi cookies gần hết hạn hoặc phát sinh lỗi 401.
- Fetch API từ Riot Service và map dữ liệu với `valorant-api.com` để lấy thông tin Skin (Tên, Giá, Icon, Độ hiếm).

#### [NEW] `src/api/riotAuth.js`
#### [NEW] `src/api/riotStorefront.js`

---

### Phase 4: Xử Lý Hình Ảnh bằng Canvas
- Xây dựng logic ghép 4 ảnh vũ khí thành 1 banner kích thước ngang sử dụng thư viện `canvas`.
- Tạo bố cục "cinematic" với nền tối, hiển thị rõ ràng giá (VP) và biểu tượng súng.

#### [NEW] `src/utils/canvasRender.js`

---

### Phase 5: Giao tiếp Discord (Commands & Events)
- Đăng ký và xử lý `Slash Commands`: `/login` và `/shop`.
- **Lệnh /login**: Bật Modal để nhập tài khoản/mật khẩu, xử lý auth ngầm, lưu cookie (đã mã hóa) và xóa thông tin nhạy cảm.
- **Lệnh /shop**: Validate user, gọi API Riot, trigger Canvas logic, trả về ảnh.
- Rate limiting cơ bản và Error handling (try/catch cho toàn bộ workflow).

#### [NEW] `src/commands/login.js`
#### [NEW] `src/commands/shop.js`
#### [NEW] `src/events/interactionCreate.js`
#### [NEW] `src/events/ready.js`
#### [NEW] `src/index.js` (Main Entry)

---

### Phase 6: Hosting & Anti-Sleep (Uptime)
- Setup Express app siêu nhẹ lắng nghe port 8080 cho mục đích UptimeRobot ping mỗi 5 phút.

#### [NEW] `src/server.js`

---

### Phase 7: Wishlist & Cron Job (Săn Shop Tự Động)
- Tạo Collection `Wishlists` trong MongoDB để lưu súng mong muốn của người dùng.
- Thêm lệnh `/wishlist add` (với tính năng Autocomplete lọc theo tên súng từ danh sách Valorant-api), `/wishlist list` và `/wishlist remove`.
- Thiết lập `node-cron` chạy vào **7:05 AM** hàng ngày.
- **Batch Processing**: Cấu hình logic lấy danh sách `UserSessions` và xử lý hàng loạt, chia nhỏ 50 user mỗi batch, delay 10s giữa các batch để tránh Riot Rate Limit. Lấy dữ liệu cửa hàng, so sánh với wishlist và gửi DM qua Discord. Log lỗi nếu user chặn inbox.

#### [NEW] `src/models/Wishlist.js`
#### [NEW] `src/commands/wishlist.js`
#### [NEW] `src/jobs/shopHunterJob.js`

## Open Questions
- Cậu có muốn tự host MongoDB / Discord Bot bây giờ và đưa biến môi trường của cậu vào file `.env` local của cậu (nhớ ignore trên github) để sau khi tớ viết xong cậu chạy thử luôn không?

## Verification Plan

### Automated Tests
- Kiểm tra các hàm logic mã hóa/giải mã hoạt động bền bỉ, sử dụng thuật toán đúng chuẩn.

### Manual Verification
- Tớ sẽ hướng dẫn cậu thiết lập environment variables, khởi động bot `node src/index.js` và tự đăng nhập trên chính máy tính của cậu.
- Kiểm tra tính ổn định của `/login`.
- Nhập `/shop` để xem ảnh Canvas trả về có đúng vị trí, render chuẩn đẹp hay không.
- Kiểm tra cơ sở dữ liệu MongoDB đảm bảo `encryptedCookies` được lưu dưới dạng nhiễu và đổi sau mỗi lần login. Dữ liệu nhạy cảm không bị lộ.
